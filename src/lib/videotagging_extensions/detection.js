const DetectionAlgorithmManager = require('../detection_algorithms').DetectionAlgorithmManager;

function Detection(videotagging, visitedFrames) {
    this.videotagging = videotagging;
    this.visitedFrames = visitedFrames;
    this.detectionAlgorithmManager = new DetectionAlgorithmManager();

    var self = this;

    //maps every frame in the video to an imageCanvas NOTE mapVideo clears the oncanplay eventListener
    this.mapVideo = function(frameHandler, exportUntil) {
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
                var frameId = self.videotagging.getCurrentFrame();
                var isLastFrame;

                switch(exportUntil) {
                    case "tagged":
                    isLastFrame = (!Object.keys(self.videotagging.frames).length) || (frameId >= parseInt(Object.keys(self.videotagging.frames)[Object.keys(self.videotagging.frames).length-1]));
                    break;
                    case "visited":
                    var lastVisitedFrameId = Math.max.apply(Math, Array.from(self.visitedFrames));
                    isLastFrame = (frameId >= lastVisitedFrameId);        
                    break;
                    case "last":
                    isLastFrame = (self.videotagging.video.currentTime >= self.videotagging.video.duration);
                    break;
                }

                if (isLastFrame) {
                    self.videotagging.video.oncanplay = null;
                    resolve();
                }
                
                frameHandler(frameId, frameCanvas, canvasContext, () => {
                    if (!isLastFrame) {
                        self.videotagging.stepFwdClicked(false);
                    }
                })
            }
        });
    }

    // TODO: Abstract to a module that receives a "framesReader" object as input
    //exports frames to the selected detection algorithm format  for model training
    this.export = function(method, exportUntil, exportPath, testSplit, cb) {

        self.detectionAlgorithmManager.setExporter(method, exportPath, self.videotagging.inputtagsarray, 
                                            Object.keys(self.videotagging.frames).length,
                                            self.videotagging.video.videoWidth,
                                            self.videotagging.video.videoHeight,
                                            testSplit);

        self.detectionAlgorithmManager.exporter.init()
            .then(() => {
                this.mapVideo(exportFrame,exportUntil).then(() => {
                let notification = new Notification('Offline Video Tagger', {
                    body: 'Successfully exported CNTK files.'
                });
                cb();
            })  
            }, (err) => {
                console.info(`Error on ${self.detectionAlgorithmManager.getCurrentExportAlgorithm()} init:`, err);
                cb(err)
            });

        function exportFrame(frameId, frameCanvas, canvasContext, frameExportCb) {
            if (!self.visitedFrames.has(frameId)) {
                return frameExportCb();
            }
            var frameTags = [];
            //confirm that frame is tagged and that no tags are unlabeled 
            var frameIsTagged = self.videotagging.frames.hasOwnProperty(frameId) && (self.videotagging.frames[frameId].length);
            if (frameIsTagged && (self.videotagging.getUnlabeledRegionTags(frameId).length != self.videotagging.frames[frameId].length)) {
                //genereate metadata from tags
                self.videotagging.frames[frameId].map( (tag) => {
                    if (!tag.tags[tag.tags.length-1]) {
                        return console.log(`frame ${frameId} region ${tag.name} has no label`);
                    }
                    var stanW = self.videotagging.video.videoWidth/tag.width;
                    var stanH = self.videotagging.video.videoHeight/tag.height;
                    frameTags.push({
                        class : tag.tags[tag.tags.length-1],
                        x1 : parseInt(tag.x1 * stanW),
                        y1 : parseInt(tag.y1 * stanH),
                        x2 : parseInt(tag.x2 * stanW),
                        y2 : parseInt(tag.y2 * stanH)
                    });

                });
            }

            //draw the frame to the canvas
            canvasContext.drawImage(self.videotagging.video, 0, 0);
            var data = frameCanvas.toDataURL('image/jpeg').replace(/^data:image\/\w+;base64,/, ""); // strip off the data: url prefix to get just the base64-encoded bytes http://stackoverflow.com/questions/5867534/how-to-save-canvas-data-to-file
            var buf = new Buffer(data, 'base64');
            var frameFileName = `${pathJS.basename(self.videotagging.src, pathJS.extname(self.videotagging.src))}_frame_${frameId}.jpg`
            self.detectionAlgorithmManager.exporter.exportFrame(frameFileName, buf, frameTags)
                .then(()=>{
                    frameExportCb();
                }, (err) => {
                    console.info('Error occured when trying to export frame', err);
                    frameExportCb(err);
                });
        }
    }

    
    //allows user to review model suggestions on a video
    this.review = function(method, modelPath, reviewPath, cb) {
        //if the export reviewPath directory does not exist create it and export all the frames then review
        if (!fs.existsSync(reviewPath)) {
            fs.mkdir(reviewPath, () =>{
                this.mapVideo(saveFrame, "last").then( () => {
                    reviewModel();
                });
            });
        } else {
            reviewModel();
        }

        function reviewModel() {
            //run the model on the reviewPath directory
            self.detectionAlgorithmManager.setReviewer(method, modelPath);
            self.detectionAlgorithmManager.reviewer.reviewImagesFolder(reviewPath).then( (modelTags) => {
                self.videotagging.frames = [];
                self.videotagging.optionalTags.createTagControls(Object.keys(modelTags.classes));

                //Create regions based on the provided modelTags
                Object.keys(modelTags.frames).map( (pathId) => {
                    var frameImage = new Image();
                    frameImage.src = `${reviewPath}\\${pathId}`;
                    frameImage.onload = loadFrameRegions; 

                    function loadFrameRegions() {
                        var imageWidth = this.width;
                        var imageHeight = this.height;
                        frameId = pathId.replace(".jpg", "");//remove.jpg
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
                    }
                });
                self.videotagging.showAllRegions();
                //cleanup and notify
                self.videotagging.video.currentTime = 0;
                self.videotagging.playingCallback();
                let notification = new Notification('Offline Video Tagger', { body: 'Model Ready For Review.' });
                cb();
            });
        }

        function saveFrame(frameId, fCanvas, canvasContext, saveCb){
            canvasContext.drawImage(videotagging.video, 0, 0);
            var writePath =  `${reviewPath}/${frameId}.jpg`
            var data = fCanvas.toDataURL('image/jpeg').replace(/^data:image\/\w+;base64,/, ""); // strip off the data: url prefix to get just the base64-encoded bytes http://stackoverflow.com/questions/5867534/how-to-save-canvas-data-to-file
            var buf = new Buffer(data, 'base64');
            //write canvas to file and change frame
            console.log('saving file', writePath);
            if (!fs.existsSync(writePath)) {
                fs.writeFileSync(writePath, buf);
            }  
            saveCb();
        }
    }

}

module.exports.Detection = Detection;