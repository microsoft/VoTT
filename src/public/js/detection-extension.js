const DetectionAlgorithmManager = require('./lib/detection_algorithms').DetectionAlgorithmManager;

function VideoTaggingCNTKExtension(options = {}) {
    this.videotagging = options.videotagging;
    this.visitedFrames = options.visitedFrames;
    this.exportUntil = options.exportUntil;
    this.exportPath = options.exportPath;
    this.cntkPath = options.cntkPath;
    this.cntkEnv = options.cntkEnv;
    this.classes = options.classes;
    this.DAM = new DetectionAlgorithmManager();
    
    //check requirements fs and rimraf
    try {
        require.resolve("fs");
        require.resolve("rimraf");
    } catch(e) {
        return console.error("VideoTaggingCNTKExtension module requires fs and rimraf.");
    }
    
    var self = this;

    //maps every frame in the video to an imageCanvas
    this.mapVideo = function(frameHandler) {
        return new Promise((resolve, reject) => {
            //init canvas buffer
            var frameCanvas = document.createElement("canvas");
            frameCanvas.width = self.videotagging.video.videoWidth;
            frameCanvas.height = self.videotagging.video.videoHeight;
            var canvasContext = frameCanvas.getContext("2d");

            // start exporting frames using the canplay eventListener
            var oldEvent = self.videotagging.video.oncanplay;
            self.videotagging.video.oncanplay = iterateFrames;
            self.videotagging.video.currentTime = 0;
            self.videotagging.playingCallback();

            function iterateFrames() {
                var frameId = self.videotagging.getCurrentFrame();
                var isLastFrame;

                switch(self.exportUntil) {
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
                    self.videotagging.video.oncanplay = oldEvent;
                    resolve();
                }
                
                frameHandler(frameId, frameCanvas, canvasContext, ()=> {
                    if (!isLastFrame) {
                        self.videotagging.stepFwdClicked(false);
                    }
                })
            }
        });
    }

    // TODO: Abstract to a module that receives a "framesReader" object as input
    //exports frames to cntk format for model training
    this.exportCNTK = function(testSetSize,cb) {

        //generate test images list 
        var testFrameIndecies = generateTestFrameIndecies(testSetSize);
        
        self.DAM.setExporter("YOLO",self.exportPath, self.classes, 
                                            Object.keys(self.videotagging.frames).length,
                                            self.videotagging.video.videoWidth,
                                            self.videotagging.video.videoHeight,
                                            testSetSize);
        /*
        //make sure paths exist
        if (!fs.existsSync(`${this.exportPath}`)) fs.mkdirSync(`${this.exportPath}`);
        var framesPath = `${this.exportPath}/${pathJS.basename(this.videotagging.src, pathJS.extname(this.videotagging.src))}_frames`;
        //clear past directory 
        rimraf(framesPath, () => { 
            fs.mkdirSync(framesPath);
            fs.mkdirSync(`${framesPath}/positive`);
            fs.mkdirSync(`${framesPath}/negative`);
            fs.mkdirSync(`${framesPath}/testImages`);
            this.mapVideo(exportFrame).then(() => {
                let notification = new Notification('Offline Video Tagger', {
                    body: 'Successfully exported CNTK files.'
                });
                cb();
            })
        });*/

        self.DAM.exporter.init()
            .then(() => {
                this.mapVideo(exportFrame).then(() => {
                let notification = new Notification('Offline Video Tagger', {
                    body: 'Successfully exported CNTK files.'
                });
                cb();
            })  
            }, (err) => {
                console.info(`Error on ${self.DAM.getCurrentExportAlgorithm()} init:`, err);
                cb(err)
            });

        function exportFrame(frameId, frameCanvas, canvasContext, frameExportCb) {
            //set default writepath to the negative folder
            //var writePath = `${framesPath}/negative/${pathJS.basename(self.videotagging.src, pathJS.extname(self.videotagging.src))}_frame_${frameId}.jpg`; //defaults to negative
            //If frame contains tags generate the metadata and save it in the positive directory
            var frameIsTagged = self.videotagging.frames.hasOwnProperty(frameId) && (self.videotagging.frames[frameId].length);
            var frameTags = [];
            if (frameIsTagged && (self.videotagging.getUnlabeledRegionTags(frameId).length != self.videotagging.frames[frameId].length)) {
                //genereate metadata from tags
                var frameBBoxes = "", frameLabels = "";
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
            self.DAM.exporter.exportFrame(frameFileName, buf, frameTags)
                .then(()=>{
                    frameExportCb();
                }, (err) => {
                    console.info('Error occured when trying to export frame', err);
                    frameExportCb(err);
                });
        }

        //random subset http://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
        function generateTestFrameIndecies(percent) {
            var keys = Object.keys(videotagging.frames);
            var size = Math.floor(percent * keys.length);
            var shuffled = keys.slice(0), i = keys.length, min = i - size, temp, index;
            while (i-- > min) {
                index = Math.floor((i + 1) * Math.random());
                temp = shuffled[index];
                shuffled[index] = shuffled[i];
                shuffled[i] = temp;
            }
            return shuffled.slice(min);
        } 

    }

    // TODO: abstract this
    //allows user to review cntk suggestions on a video
    this.reviewCNTK = function(modelPath, cb) {
        //check if an export directory for the current model exists
        var previousExportUntil = this.exportUntil;
        if (!fs.existsSync(`${this.exportPath}`)) fs.mkdirSync(`${this.exportPath}`);
        var reviewPath = `${this.exportPath}/${pathJS.basename(this.videotagging.src, pathJS.extname(this.videotagging.src))}_review`;
        //if the export directory does not exist create it and export all the frames then review
        if (!fs.existsSync(reviewPath)) {
            fs.mkdirSync(reviewPath);
            this.exportUntil = "last";
            this.mapVideo(saveFrame).then(review);
        } else {
            review();
        }

        function review() {
            self.exportUntil = previousExportUntil;
            //run the model on the reviewPath directory
            model = new cntkModel.CNTKFRCNNModel({cntkModelPath : modelPath, cntkPath: self.cntkPath, verbose : true});
            var modelTagsPromise = new Promise((resolve, reject) => { 
                model.evaluateDirectory(reviewPath, (err, res) => {
                    if (err) {
                        console.info(err);
                        reject();
                    }
                    resolve(res);
                });
            });

            modelTagsPromise.then( (modelTags) => {
                $('#video-tagging').off("stepFwdClicked-BeforeStep");
                $('#video-tagging').off("stepFwdClicked-AfterStep");
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
                        videotagging.frames[frameId] = [];
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
                            name:(self.videotagging.frames[frameId].length + 1)
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

        function saveFrame(frameId, fCanvas, canvasContext){
            canvasContext.drawImage(videotagging.video, 0, 0);
            var writePath = reviewPath+ `/${frameId}.jpg`
            var data = fCanvas.toDataURL('image/jpeg').replace(/^data:image\/\w+;base64,/, ""); // strip off the data: url prefix to get just the base64-encoded bytes http://stackoverflow.com/questions/5867534/how-to-save-canvas-data-to-file
            var buf = new Buffer(data, 'base64');
            //write canvas to file and change frame
            console.log('saving file', writePath);
            if (!fs.existsSync(writePath)) {
                fs.writeFileSync(writePath, buf);
            }  
        }
    }

}