const DetectionAlgorithmManager = require('../detection_algorithm_manager').DetectionAlgorithmManager;
const path = require('path');
const fs = require('fs');

function Detection(videotagging, visitedFrames) {
    this.videotagging = videotagging;
    this.visitedFrames = visitedFrames;
    this.detectionAlgorithmManager = new DetectionAlgorithmManager();

    var self = this;

    //maps every frame in the video to an imageCanvas until a specified point NOTE mapVideo clears the oncanplay eventListener
    this.mapVideo = function (frameHandler, isLastFrame) {
        return new Promise((resolve, reject) => {
            //init canvas buffer
            var frameCanvas = document.createElement("canvas");
            frameCanvas.width = self.videotagging.video.videoWidth;
            frameCanvas.height = self.videotagging.video.videoHeight;
            var canvasContext = frameCanvas.getContext("2d");

            // start exporting frames using the canplay eventListener
            self.videotagging.video.oncanplay = iterateFrames;
            self.videotagging.video.currentTime = 0;
            self.videotagging.playingCallback();

            function iterateFrames() {
                var frameNumber = self.videotagging.getCurrentFrameNumber();
                var lastFrame = isLastFrame(frameNumber);
                if (lastFrame) {
                    self.videotagging.video.oncanplay = null;
                    resolve();
                }

                var frameName = `${path.basename(self.videotagging.src, path.extname(self.videotagging.src))}_frame_${frameNumber}.jpg`
                frameHandler(frameName, frameNumber, frameCanvas, canvasContext, (err) => {
                    if (err) {
                        reject(err);
                    }
                    if (!lastFrame) {
                        self.videotagging.stepFwdClicked(false);
                    }
                })
            }
        });
    }

    //this maps dir of images for exporting
    this.mapDir = function (frameHandler, dir, isLastFrame) {
        return new Promise((resolve, reject) => {
            imagesProcessed = 0;
            dir.forEach((imagePath, index) => {
                if(!isLastFrame(index)){
                    var img = new Image();
                    img.src = imagePath;
                    img.onload = function () {
                        var frameCanvas = document.createElement("canvas");
                        frameCanvas.width = img.width;
                        frameCanvas.height = img.height;
                        // Copy the image contents to the canvas
                        var canvasContext = frameCanvas.getContext("2d");
                        canvasContext.drawImage(img, 0, 0);
                        frameHandler(path.basename(imagePath), index, frameCanvas, canvasContext, (err) => {
                            if (err) {
                                reject(err);
                            }
                            imagesProcessed += 1;
                            if (isLastFrame(imagesProcessed)) {
                                resolve();
                            }
                        });
                    }
                } else {
                    resolve();
                }
            });
        });
    }

    // TODO: Abstract to a module that receives a "framesReader" object as input
    //exports frames to the selected detection algorithm format  for model training
    this.export = function (dir, method, exportUntil, exportPath, testSplit, cb) {
        self.detectionAlgorithmManager.initExporter(method, exportPath, self.videotagging.inputtagsarray,
            Object.keys(self.videotagging.frames).length,
            self.videotagging.sourceWidth,
            self.videotagging.sourceHeight,
            testSplit,
            (err, exporter) => {
                if (err) {
                    cb(err);
                }
                //resolve export until
                var isLastFrame;
                if (exportUntil === "tagged") {
                    isLastFrame = function (frameId) {
                        let taggedFrames = Object.keys(self.videotagging.frames)
                            .filter(key => self.videotagging.frames[key].length)
                            .reduce((res, key) => (res[key] = self.videotagging.frames[key], res), {}); // eslint-disable-line
                        let condition = (self.videotagging.imagelist) ? self.videotagging.imagelist.indexOf(Object.keys(taggedFrames)[Object.keys(taggedFrames).length - 1]) : parseInt(Object.keys(taggedFrames)[Object.keys(taggedFrames).length - 1])
                        return (!Object.keys(taggedFrames).length) || (frameId >= condition)
                    }
                }
                else if (exportUntil === "visited") {
                    isLastFrame = function (frameId) {
                        let lastVisitedFrameId = (self.videotagging.imagelist) ? self.videotagging.imagelist.indexOf(Array.from(self.visitedFrames)[Array.from(self.visitedFrames).length -1]) : Math.max.apply(Math, Array.from(visitedFrames));
                        return (frameId >= lastVisitedFrameId);
                    }
                }
                else { //last
                    isLastFrame = function (frameId) {
                        if(self.videotagging.imagelist){
                            return (self.videotagging.imageIndex >= self.videotagging.imagelist.length);
                        } else{
                            return (self.videotagging.video.currentTime + 1 >= self.videotagging.video.duration);
                        }
                    }
                }
                if (dir) {
                    this.mapDir(exportFrame.bind(err, exporter), dir, isLastFrame).then(exportFinished, (err) => {
                        console.info(`Error on ${method} init:`, err);
                        cb(err);
                    });

                } else {
                    this.mapVideo(exportFrame.bind(err, exporter), isLastFrame).then(exportFinished, (err) => {
                        console.info(`Error on ${method} init:`, err);
                        cb(err);
                    });
                }

                function exportFinished() {
                    let notification = new Notification('Offline Video Tagger', {
                        body: `Successfully exported ${method} files.`
                    });
                    cb();
                }

            });

        function exportFrame(exporter, frameName, frameId, frameCanvas, canvasContext, frameExportCb) {
            //correct frameId -- for images image name is used as ID now
            frameId = (self.videotagging.imagelist) ? frameName : frameId;
            
            if (!self.visitedFrames.has(frameId)) {
                return frameExportCb();
            }
            var frameTags = [];
            
            //confirm that frame is tagged and that no tags are unlabeled 
            var frameIsTagged = self.videotagging.frames.hasOwnProperty(frameId) && (self.videotagging.frames[frameId].length);
            if (frameIsTagged && (self.videotagging.getUnlabeledRegionTags(frameId).length != self.videotagging.frames[frameId].length)) {
                //genereate metadata from tags
                self.videotagging.frames[frameId].map((region) => {
                    if (!region.tags[region.tags.length - 1]) {
                        return console.log(`frame ${frameId} region ${region.name} has no label`);
                    }
                    var stanW = self.videotagging.sourceWidth / region.width; // 1.0
                    var stanH = self.videotagging.sourceHeight / region.height; // 1.0
                    //var stanW = (self.videotagging.imagelist) ? frameCanvas.width / region.width : self.videotagging.video.videoWidth / region.width;
                    //var stanH = (self.videotagging.imagelist) ? frameCanvas.height / region.height : self.videotagging.video.videoHeight / region.height;
                    var tag = {
                        class: region.tags[region.tags.length - 1],
                        x1: region.box.x1,
                        y1: region.box.y1,
                        x2: region.box.x2,
                        y2: region.box.y2,
                        w: region.width,
                        h: region.height
                    };
                    frameTags.push(tag);

                });
            }

            //draw the frame to the canvas
            var buf = self.canvasToJpgBuffer(frameCanvas, canvasContext);
            exporter(frameName, buf, frameTags)
                .then(() => {
                    frameExportCb();
                }, (err) => {
                    console.info('Error occured when trying to export frame', err);
                    frameExportCb(err);
                });
        }
    }

    //allows user to review model suggestions on a video
    this.review = function(dir, method, modelPath, reviewPath, cb) {
        //if the export reviewPath directory does not exist create it and export all the frames then review
        fs.exists(reviewPath, (exists) => {
            if (!exists){
                fs.mkdir(reviewPath, (err) => {
                    if (err){
                        cb(err);
                    }
                    if (dir){
                        this.mapDir(saveFrame, dir).then( () => {
                            reviewModel();
                        });                        
                    } else {
                        this.mapVideo(saveFrame, "last").then( () => {
                            reviewModel();
                        });                        
                    }
                });
            } else {
                reviewModel();
            }
        
            function reviewModel() {
                //run the model on the reviewPath directory
                self.detectionAlgorithmManager.initReviewer(method, modelPath, (reviewImagesFolder) => {
                    reviewImagesFolder(reviewPath).then(modelTags => {
                        self.videotagging.frames = {};
                        self.videotagging.optionalTags.createTagControls(Object.keys(modelTags.classes));

                        //Create regions based on the provided modelTags
                        var p = new Promise ((resolve, reject) => {
                            Object.keys(modelTags.frames).map((pathId) => {
                                var frameImage = new Image();
                                frameImage.src = path.join(reviewPath, pathId);
                                frameImage.onload = loadFrameRegions; 

                                function loadFrameRegions() {
                                    var imageWidth = this.width;
                                    var imageHeight = this.height;
                                    frameId = pathId.replace(".jpg", "");//remove.jpg
                                    console.log(frameId)
                                    self.videotagging.frames[frameId] = [];
                                    modelTags.frames[pathId].regions.forEach( (region) => {
                                        self.videotagging.frames[frameId].push({
                                        x1:region.x1,
                                        y1:region.y1,
                                        x2:region.x2,
                                        y2:region.y2,                          
                                        id:self.videotagging.uniqueTagId++,
                                        width:imageWidth,
                                        height:imageHeight,
                                        type:self.videotagging.regiontype,
                                        tags:Object.keys(modelTags.classes).filter( (key) => {return modelTags.classes[key] === region.class }),
                                        name:(self.videotagging.frames[frameId].length + 1),
                                        blockSuggest: true
                                        }); 
                                    });
                                    if (Object.keys(self.videotagging.frames).length >= Object.keys(modelTags.frames).length){
                                        resolve();
                                    }
                                }
                            })                       
                        });

                        p.then(()=>{
                            self.videotagging.showAllRegions();
                            //cleanup and notify
                            self.videotagging.video.currentTime = 0;
                            self.videotagging.playingCallback();
                            let notification = new Notification('Offline Video Tagger', { body: 'Model Ready For Review.' });
                            cb();
                        });
                    }, (err) => {
                        cb(err);
                    });
                });
            }

            function saveFrame(frameName, frameId, fCanvas, canvasContext, saveCb){
                var writePath =  path.join(reviewPath, `${frameId}.jpg`);
                //write canvas to file and change frame
                console.log('saving file', writePath);
                fs.exists(writePath, (exists) => {
                    if (!exists) {
                        fs.writeFile(writePath, self.canvasToJpgBuffer(fCanvas, canvasContext), saveCb);
                    }  
                });
            }
        });
    }

    this.reviewEndpoint = function (dir, endpoint, cb) {
        console.log(endpoint);
        if (dir) {
            this.mapDir(detectFrame, dir).then(() => {
                cb();
            },(err) => {
                cb(err);
            });
        } else {
            this.mapVideo(detectFrame, "last").then(() => {
                cb();
            },(err) => {
                cb(err);
            });
        }
        self.videotagging.frames = {};

        function detectFrame(frameName, frameId, fCanvas, canvasContext, detectCb) {
            // extract img from 
            var frame_img =  self.canvasToArrayBuffer(fCanvas, canvasContext, frameId);
            fetch(endpoint, {
                method: 'post', body: frame_img, headers: {
                    contentType: "application/octet-stream"
                }
            }).then(response => response.json()
            ).then((data)=>{
                //dumb way to do this fix with a promis
                self.videotagging.optionalTags.createTagControls(Object.keys(data.classes));
                self.videotagging.frames[frameId] = [];
                data.frames[`${frameId}.jpg`].regions.forEach((region) => {
                    self.videotagging.frames[frameId].push({
                        x1: region.x1,
                        y1: region.y1,
                        x2: region.x2,
                        y2: region.y2,
                        id: self.videotagging.uniqueTagId++,
                        width: fCanvas.width,
                        height: fCanvas.height,
                        type: self.videotagging.regiontype,
                        tags: Object.keys(data.classes).filter((key) => { return data.classes[key] === region.class }),
                        name: (self.videotagging.frames[frameId].length + 1),
                        blockSuggest: true,
                    });
                    self.videotagging.showAllRegions();
                    detectCb();
                });
            }).catch((err)=>{
                detectCb(err);
            }); 
        }
    }

    this.canvasToJpgBuffer = function(canvas, canvasContext) {
        canvasContext.drawImage(videotagging.video, 0, 0);
        var data = canvas.toDataURL('image/jpeg').replace(/^data:image\/\w+;base64,/, ""); // strip off the data: url prefix to get just the base64-encoded bytes http://stackoverflow.com/questions/5867534/how-to-save-canvas-data-to-file
        return new Buffer(data, 'base64');
    }

    this.canvasToArrayBuffer = function(canvas, canvasContext, frameId){
        canvasContext.drawImage(videotagging.video, 0, 0);
        var base64ImageContent = canvas.toDataURL('image/jpeg');
        var blobBin = atob(base64ImageContent.split(',')[1]);
        var array = [];
        for(var i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i));
        }
        var file =new Blob([new Uint8Array(array)], {type: 'image/png'});
        
        var formdata = new FormData();
        formdata.append("filename", frameId);
        formdata.append("image", file);
        return formdata;        
    }

}

module.exports.Detection = Detection;