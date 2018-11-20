function VideoTaggingTrackingExtension( options = {} ) {
    this.videotagging = options.videotagging;
    this.trackingFrameRate = Math.max(options.trackingFrameRate, this.videotagging.framerate + 1);
    this.saveHandler = options.saveHandler;
    this.method = options.method;
    this.enableRegionChangeDetection = options.enableRegionChangeDetection;
    this.enableSceneChangeDetection = options.enableRegionChangeDetection;

    var self = this;

    //disables tracking  
    this.stopTracking = function() {
        $('#video-tagging').off("stepFwdClicked-BeforeStep");
        $('#video-tagging').off("stepFwdClicked-AfterStep");
        //add event to prevent non tracked regions from giving suggestions
        $('#video-tagging').on("stepFwdClicked-BeforeStep", () => {
            self.saveHandler();
            var regionCount = $('.regionCanvas').length;
            if (regionCount) {         
                var curFrame = self.videotagging.getCurrentFrame();
                $.map($('.regionCanvas'), (regionCanvas, i) => { 
                    //get regionId
                    for (regInd = 0; regInd < self.videotagging.frames[curFrame].length; regInd++) {
                        if (self.videotagging.frames[curFrame][regInd].name = regionCanvas.id) {
                            self.videotagging.frames[curFrame][regInd].blockSuggest = true;
                        }
                    }
                });
            }
        });
    }

    //enables tracking
    this.startTracking = function() {
        $('#video-tagging').off("stepFwdClicked-BeforeStep");
        this.videotagging.video.addEventListener("canplay",  this.init);
    }

    //initiazes tracking
    this.init = function() {
        self.videotagging.video.removeEventListener("canplay", self.init); //remove old listeners
        $('#video-tagging').off("stepFwdClicked-BeforeStep");
        $('#video-tagging').off("stepFwdClicked-AfterStep");
    
        var regionsToTrack = [];
        $('#video-tagging').on("stepFwdClicked-BeforeStep", () => {
            self.saveHandler();
            self.videotagging.canMove = false;
            var regionCount = $('.regionCanvas').length;
            if (regionCount) {         
                var curFrame = self.videotagging.getCurrentFrame();
                //init store imagedata for scene detection
                var stanW = self.videotagging.video.videoWidth/self.videotagging.video.offsetWidth,
                    stanH = self.videotagging.video.videoHeight/self.videotagging.video.offsetHeight;
                $.map($('.regionCanvas'), (regionCanvas, i) => { 
                //scale window to video 
                var w = Math.round(parseInt(regionCanvas.style.width) * stanW);
                var h = Math.round(parseInt(regionCanvas.style.height) * stanH);
                var y = Math.round(parseInt(regionCanvas.style.top) * stanH);
                var x = Math.round(parseInt(regionCanvas.style.left) * stanW);
                //get regionId
                var originalRegion = $.grep(self.videotagging.frames[curFrame], function(e){ return e.name == regionCanvas.id;})[0];
                //if region is in blacklist don't track
                if (originalRegion.blockSuggest) return;
                //add region to be tracked 
                regionsToTrack.push({x,y,w,h,originalRegion});
                });
            }
        });

        //runs tracking after step and adds each suggestion to tracked regions
        $('#video-tagging').on("stepFwdClicked-AfterStep", () => {
            self.videotagging.video.addEventListener("canplay", afterStep);
        });  

        function afterStep() {
            self.videotagging.video.removeEventListener("canplay", afterStep);

            if (regionsToTrack.length) {
                var curFrame = self.videotagging.getCurrentFrame(),
                    stanW = self.videotagging.video.offsetWidth/self.videotagging.video.videoWidth,
                    stanH = self.videotagging.video.offsetHeight/self.videotagging.video.videoHeight;
                
                if (self.method === "track"){
                    // pass regions to track 
                    track(regionsToTrack).then( (suggestions) => {
                        suggestions.forEach((suggestion) => {
                            var x1, y1, x2, y2;
                            if (suggestion.type == "copy") {
                                x1 = suggestion.region.x * stanW;
                                y1 = suggestion.region.y * stanH;
                                x2 = x1 + suggestion.region.w * stanW;
                                y2 = y1 + suggestion.region.h * stanH;
                            } else { //get bounding box of tracked object
                                x1 = Math.max(Math.round(suggestion.region.x * stanW) - Math.round((suggestion.region.w * stanW)/2), 0),
                                y1 = Math.max(Math.round(suggestion.region.y * stanH) - Math.round((suggestion.region.h * stanH)/2), 0),
                                x2 = Math.min(Math.round(suggestion.region.w * stanW) + x1, self.videotagging.video.offsetWidth),
                                y2 = Math.min(Math.round(suggestion.region.h * stanH) + y1, self.videotagging.video.offsetHeight);
                            }
                            // create new region
                            self.videotagging.createRegion(x1, y1, x2, y2);
                            self.videotagging.frames[curFrame][self.videotagging.frames[curFrame].length-1].tags = suggestion.originalRegion.tags;
                            self.videotagging.frames[curFrame][self.videotagging.frames[curFrame].length-1].suggestedBy = {frameId:curFrame-1, regionId:suggestion.originalRegion.id};        
                            // add suggested by to previous region to blacklist
                            self.videotagging.frames[curFrame-1][suggestion.originalRegion.name-1].blockSuggest = true;
                        });   
                            regionsToTrack = [];
                            self.videotagging.canMove = true;
                        }).catch( (e) => {
                            console.info(e);
                            regionsToTrack = [];
                            self.videotagging.canMove = true;
                        });

                }
                else if (self.method == "copy"){
                    regionsToTrack.forEach((region) => {
                        var x1, y1, x2, y2;
                            x1 = region.x * stanW;
                            y1 = region.y * stanH;
                            x2 = x1 + region.w * stanW;
                            y2 = y1 + region.h * stanH;
                        // create new region
                        self.videotagging.createRegion(x1, y1, x2, y2);
                        self.videotagging.frames[curFrame][self.videotagging.frames[curFrame].length-1].tags = region.originalRegion.tags;
                        self.videotagging.frames[curFrame][self.videotagging.frames[curFrame].length-1].suggestedBy = {frameId:curFrame-1, regionId:region.originalRegion.id};        
                        // add suggested by to previous region to blacklist
                        self.videotagging.frames[curFrame-1][region.originalRegion.name-1].blockSuggest = true;
                    });   
                    regionsToTrack = [];
                    self.videotagging.canMove = true;
                }
            } else {
                self.videotagging.canMove =true;
            }        
        }     

        function track(regions) {
            return new Promise((resolve, reject) => {
                var video = document.createElement('video');
                video.src = self.videotagging.video.src;
                video.currentTime = self.videotagging.video.currentTime - (1/self.videotagging.framerate);
                video.oncanplay = initTracker;    
                video.load();

                var cstracker = new regiontrackr.camshift.Tracker({whitebalancing : false, calcAngles : false});
                var tagging_duration, frameCanvas, canvasContext, scd, rcd;
                var suggestions = [];
                
                function initTracker() {
                    video.oncanplay = undefined;
                    frameCanvas = document.createElement("canvas");
                    frameCanvas.width = video.videoWidth;
                    frameCanvas.height = video.videoHeight;
                    canvasContext = frameCanvas.getContext("2d")
                    canvasContext.drawImage(video, 0, 0);

                    tagging_duration = Math.min(self.videotagging.video.currentTime , self.videotagging.video.duration);

                    //detect if scene change
                    if (self.enableSceneChangeDetection){
                        scd = new SceneChangeDetector({ threshold:49, detectionRegion: { w:frameCanvas.width, h:frameCanvas.height } });
                        scd.detectSceneChange(video, frameCanvas, canvasContext, self.videotagging.framerate).then((sceneChanged) => {          
                            if (!sceneChanged) {
                                video.oncanplay = trackFrames;    
                                video.currentTime += (1 / self.trackingFrameRate);          
                            } else {
                                reject("scene changed");
                            }
                        }).catch((e) => {console.info(e)});
                    }
                    else {
                         video.oncanplay = trackFrames;    
                         video.currentTime += (1 / self.trackingFrameRate);    
                    }
                }

                function trackFrames() { 
                    if (!regions.length) {
                        video.oncanplay = undefined;    
                        return resolve(suggestions);
                    }
                    
                    var regionDetectionPromises = [];
                    regions.forEach((region, i) => {
                        // if first pass check whether the region changed
                        if (self.enableRegionChangeDetection && region.regionChanged === undefined) {
                            rcd = new SceneChangeDetector({ threshold:1, detectionRegion: { w:region.w, h:region.h} });   
                            regionDetectionPromises.push(rcd.detectRegionChange(video, frameCanvas, region, i, self.videotagging.framerate));
                        } else {
                            if (region.regionChanged || !self.enableRegionChangeDetection) {
                                trackRegion(region, i);
                            }
                        }                
                    });  

                    Promise.all(regionDetectionPromises).then((values) => {
                        values.sort((a,b) => { return b.index - a.index; });//sort so removal works correctly
                        values.forEach ( (rp) => { //rp is resolved promise
                            if (rp.regionChanged) {
                                 trackRegion(rp.region, rp.index); 
                                 regions[rp.index].regionChanged = rp.regionChanged; //make sure region change only executes once
                            } else {
                                 suggestions.push({type:"copy", region : rp.region, originalRegion: rp.region.originalRegion});
                                 regions.splice(rp.index,1);
                            }
                        });
                        if (video.currentTime >= tagging_duration) {
                            video.oncanplay = undefined;    
                            resolve(suggestions);
                        } else { 
                            video.currentTime += (1 / self.trackingFrameRate);//go to next frame segment
                        }
                    },(e)=>{console.info(e);});
                }

                function trackRegion(region, i) {   
                    //on exit condition push to suggestions
                    if (video.currentTime >= tagging_duration) {
                        if (region.trackedObject) {
                            suggestions.push({type:"tracked", region:{x : region.trackedObject.x, y : region.trackedObject.y, w : region.w, h: region.h}, originalRegion: region.originalRegion});
                        } 
                    }
                    //init tracker for region  
                    if (!region.trackedObject){
                        cstracker.initTracker(frameCanvas, new regiontrackr.camshift.Rectangle(region.x, region.y, region.w, region.h));
                    } else {
                        if (region.trackedObject.width === 0 || region.trackedObject.height === 0 ) { //skip tracking if object disapeared
                            return;
                        } else {
                            cstracker.initTracker(frameCanvas, new regiontrackr.camshift.Rectangle(region.tx, region.ty, region.w, region.h));
                        }
                    }
                    //track region
                    canvasContext.drawImage(video, 0, 0);
                    cstracker.track(frameCanvas);
                    regions[i].trackedObject = cstracker.getTrackObj();  
                    //create new tracker 
                    regions[i].tx = Math.round(region.trackedObject.x - region.w/2);
                    regions[i].ty = Math.round(region.trackedObject.y - region.h/2);
                }
            });
        } 
        
    }

}