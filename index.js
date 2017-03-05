const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const pathJS = require('path');
const fs = require('fs');
const cntkModel= require('cntk-fastrcnn');
const cntkDefaultPath = 'c:/local/cntk';
const modelFileLocation = `${basepath}/Fast-RCNN.model`;
const ipcRenderer = require('electron').ipcRenderer;
var supertrackingFrameRate = 10;


var furthestVisitedFrame, //keep track of the furthest visited frame
    videotagging,
    trackingSuggestionsBlacklist; //keep track of deleted suggestions

//ipc rendering
ipcRenderer.on('openVideo', (event, message) => {
  fileSelected();
});

ipcRenderer.on('saveVideo', (event, message) => {
  save();
});

ipcRenderer.on('exportCNTK', (event, message) => {
  exportCNTK();
});

ipcRenderer.on('reviewCNTK', (event, message) => {
    if (fs.existsSync(cntkDefaultPath)) {
        if (fs.existsSync(modelFileLocation)){
          reviewCNTK();
        } else {
            alert(`No model found! Please make sure you put your model in the following directory: ${modelFileLocation}`)
        }
        
    } else {
      alert("This feature isn't supported by your system please check your CNTK configuration and try again later.");
    }
});


//drag and drop support
document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files[0].type == "video/mp4") {
      fileSelected(e.dataTransfer.files[0]);
    }
    return false;
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0].type == "video/mp4") {
      e.dataTransfer.dropEffect = "copy";
    }
    e.stopPropagation();
});

document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    if (file && file.type == "video/mp4") {
        e.dataTransfer.effectAllowed = "copy";
    }
    e.stopPropagation();
});

// stop zooming
document.addEventListener('mousewheel', (e) => {
  if(e.ctrlKey) {
    e.preventDefault();
  }
});

//adds a loading animation to the tagger
function addLoader() {
  if(!$('.loader').length) {
    $("<div class=\"loader\"></div>").appendTo($("#videoWrapper"));
  }
}

//managed the furthest visited frame
function updateFurthestVisitedFrame(){
  var currentFrame = videotagging.getCurrentFrame();
  if (furthestVisitedFrame < currentFrame) furthestVisitedFrame = currentFrame;
}

function checkPointRegion() {
  if ($('#regiontype').val() != "Point") {
    $('#regionPointGroup').hide();
  } else {
    $('#regionPointGroup').show();
  }
}

//load logic
function fileSelected(path) {
   $('#load-message').hide();

  if (path) {  //checking if a video is dropped
    let pathName = path.path;
    openPath(pathName);
  } else { // showing system open dialog
    dialog.showOpenDialog({
      filters: [{ name: 'Videos', extensions: ['mp4']}],
      properties: ['openFile']
    },
    function (pathName) {
      if (pathName) openPath(pathName[0]);
      else $('#load-message').show();
    });
  }

  function openPath(pathName) {
    var config;

    // show configuration
    $('#load-message').hide();
    $('#video-tagging-container').hide()
    $('#load-form-container').show();
    $('#framerateGroup').show();
    
    //set title indicator
    $('title').text(`Video Tagging Job Configuration: ${pathJS.basename(pathName, pathJS.extname(pathName))}`);
    
    $('#inputtags').tagsinput('removeAll');//remove all previous tag labels

    try {
      config = require(`${pathName}.json`);
      //restore tags
      $('#inputtags').val(config.inputTags);
      config.inputTags.split(",").forEach( tag => {
          $("#inputtags").tagsinput('add',tag);
      });
    } catch (e) {
      console.log(`Error loading save file ${e.message}`);
    }

    // REPLACE implementation, use jQuery to remove all event handlers on loadbutton
    document.getElementById('loadButton').parentNode.replaceChild(document.getElementById('loadButton').cloneNode(true), document.getElementById('loadButton'));
    document.getElementById('loadButton').addEventListener('click', loadTagger);
    
    function loadTagger (e) {
      if(framerate.validity.valid) {
       
        $('title').text(`Video Tagging Job: ${pathJS.basename(pathName, pathJS.extname(pathName))}`); //set title indicator

        videotagging = document.getElementById('video-tagging'); //find out why jquery doesn't play nice with polymer
        videotagging.regiontype = $('#regiontype').val();
        videotagging.multiregions = 1;
        videotagging.regionsize = $('#regionsize').val();
        videotagging.inputtagsarray = $('#inputtags').val().split(',');
        videotagging.video.currentTime = 0;
        videotagging.framerate = $('#framerate').val();

        if (config) videotagging.inputframes = config.frames;
        else videotagging.inputframes = {};

        videotagging.src = pathName;
        videotagging.video.oncanplay = function (){
                      //set start time
            videotagging.videoStartTime = videotagging.video.currentTime;
            videotagging.video.oncanplay = undefined;
        }
        //videotagging.video.load();//load video

        //track furthestVisitedFrame
        furthestVisitedFrame = 1;
        videotagging.video.removeEventListener("canplay", updateFurthestVisitedFrame); //remove old listener
        videotagging.video.addEventListener("canplay",updateFurthestVisitedFrame);

        //init region tracking
        videotagging.video.addEventListener("canplay",  initRegionTracking);

        $('#load-form-container').hide();
        $('#video-tagging-container').show();

        ipcRenderer.send('setFilePath', pathName);
      }
    }
  }
}

//saves current video to config 
function save() {
    var saveObject = {
      "frames" : videotagging.frames,
      "inputTags": $('#inputtags').val(),
      "exportTo": $('#exportTo').val(),
      "furthestVisitedFrame": furthestVisitedFrame
    };
    
    fs.writeFileSync(`${videotagging.src}.json`, JSON.stringify(saveObject));

    let notification = new Notification('Offline Video Tagger', {
      body: 'Successfully saved metadata in ' + `${videotagging.src}.json`
    });
}

//maps every frame in the video to an imageCanvas
function mapVideo(exportUntil, frameHandler) {
   return new Promise((resolve, reject) => {
    //init canvas buffer
    var frameCanvas = document.createElement("canvas");
    frameCanvas.width = videotagging.video.videoWidth;
    frameCanvas.height = videotagging.video.videoHeight;
    var canvasContext = frameCanvas.getContext("2d");

    // start exporting frames using the canplay eventListener
    videotagging.video.removeEventListener("canplay", updateFurthestVisitedFrame); //stop recording frame movment
    videotagging.video.addEventListener("canplay", iterateFrames);
    videotagging.video.currentTime = 0;
    videotagging.playingCallback();

    function iterateFrames() {
      var frameId = videotagging.getCurrentFrame();
      var isLastFrame;

      switch(exportUntil) {
        case "tagged":
          isLastFrame = (!Object.keys(videotagging.frames).length) || (frameId >= parseInt(Object.keys(videotagging.frames)[Object.keys(videotagging.frames).length-1]));
          break;
        case "visited":
          isLastFrame = (frameId >= furthestVisitedFrame);        
          break;
        case "last":
          isLastFrame = (videotagging.video.currentTime >= videotagging.video.duration);
          break;
      }

      if (isLastFrame) {
        videotagging.video.removeEventListener("canplay", iterateFrames);
        videotagging.video.addEventListener("canplay", updateFurthestVisitedFrame);
        resolve();
      }
      
      frameHandler(frameId, frameCanvas, canvasContext);
      if (!isLastFrame) {
        videotagging.stepFwdClicked(false);
      } 
    }
  });
}

//exports frames to cntk format for model training
function exportCNTK() {
  addLoader();

  /* create constants for all the paths with meaningful names*/

  //make sure paths exist
  if (!fs.existsSync(`${basepath}/cntk`)) fs.mkdirSync(`${basepath}/cntk`);
  var framesPath = `${basepath}/cntk/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}_frames`;

  if (!fs.existsSync(framesPath)) fs.mkdirSync(framesPath);
  if (!fs.existsSync(`${framesPath}/positive`)) fs.mkdirSync(`${framesPath}/positive`);
  if (!fs.existsSync(`${framesPath}/negative`)) fs.mkdirSync(`${framesPath}/negative`);

  mapVideo($('#exportTo').val(), exportFrame).then(() => {
    $(".loader").remove();
    let notification = new Notification('Offline Video Tagger', {
      body: 'Successfully exported CNTK files.'
    });
  })

  function exportFrame(frameId, frameCanvas, canvasContext) {

    //set default writepath to the negative folder
    var writePath = `${framesPath}/negative/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}_frame_${frameId}.jpg`; //defaults to negative
    var positiveWritePath = `${framesPath}/positive/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}_frame_${frameId}.jpg`;
    //If frame contains tags generate the metadata and save it in the positive directory
    var frameIsTagged = videotagging.frames.hasOwnProperty(frameId) && (videotagging.frames[frameId].length);
    if (frameIsTagged && (videotagging.getUnlabeledRegionTags(frameId).length != videotagging.frames[frameId].length)) {
        //clear metadata if image exists from last run
        if (fs.existsSync(writePath)) 
          fs.unlinkSync(writePath);
        if (fs.existsSync(positiveWritePath)) {
          // checking to see if no tags were saved from last run
          if (fs.existsSync(positiveWritePath.replace('.jpg', '.bboxes.labels.tsv'))) {
            fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.labels.tsv'));
          }
          if (fs.existsSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'))) {
            fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'));
          }
        }
        //genereate metadata from tags
        videotagging.frames[frameId].map( (tag) => {
          if (!tag.tags[tag.tags.length-1]) {
            return console.log(`frame ${frameId} region ${tag.name} has no label`);
          }
          var stanW = videotagging.video.videoWidth/tag.width;
          var stanH = videotagging.video.videoHeight/tag.height;
          fs.appendFile(positiveWritePath.replace('.jpg', '.bboxes.labels.tsv'), `${tag.tags[tag.tags.length-1]}\n`, (err) => {console.error(err)});
          fs.appendFile(positiveWritePath.replace('.jpg', '.bboxes.tsv'), `${parseInt(tag.x1 * stanW)}\t${parseInt(tag.y1 * stanH)}\t${parseInt(tag.x2 * stanW)}\t${parseInt(tag.y2 * stanH)}\n`, (err) => {console.error(err)});
        });
        writePath = positiveWritePath; // set write path to positve write path
    }
    else if(fs.existsSync(positiveWritePath)) { //tags have been removed clear positive data if it exists from last run
        fs.unlinkSync(positiveWritePath);
        if (fs.existsSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'))) 
          fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'));
        if (fs.existsSync(positiveWritePath.replace('.jpg', '..bboxes.labels.tsv'))) 
          fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.labels.tsv'));
    }

    //draw the frame to the canvas
    canvasContext.drawImage(videotagging.video, 0, 0);
    var data = frameCanvas.toDataURL('image/jpeg').replace(/^data:image\/\w+;base64,/, ""); // strip off the data: url prefix to get just the base64-encoded bytes http://stackoverflow.com/questions/5867534/how-to-save-canvas-data-to-file
    var buf = new Buffer(data, 'base64');

    //write canvas to file and change frame
    console.log('saving file', writePath);
    if(!fs.existsSync(writePath)) {
      fs.writeFileSync(writePath, buf);
    }
  }
}

//allows user to review cntk suggestions on a video
function reviewCNTK() {
  addLoader();
  
  //check if an export directory for the current model exists
  if (!fs.existsSync(`${basepath}/cntk`)) fs.mkdirSync(`${basepath}/cntk`);
  var reviewPath = `${basepath}/cntk/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}_review`;
  
  //if the export directory does not exist create it and export all the frames then review
  if (!fs.existsSync(reviewPath)) {
    fs.mkdirSync(reviewPath);
    mapVideo("last", saveFrame).then(review);
  } else {
    review();
  }

  function review() {
    //run the model on the reviewPath directory
    model = new cntkModel.CNTKFRCNNModel({cntkModelPath : modelFileLocation, verbose : true});

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
      videotagging.video.removeEventListener("canplay", initRegionTracking); //remove region tracking listener
      $('#video-tagging').off("stepFwdClicked-BeforeStep");
      $('#video-tagging').off("stepFwdClicked-AfterStep");
      videotagging.frames=[];
      videotagging.optionalTags.createTagControls(Object.keys(modelTags.classes));

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
            videotagging.frames[frameId].push({
              x1:region.x1,
              y1:region.y1,
              x2:region.x2,
              y2:region.y2,                          
              id:videotagging.uniqueTagId++,
              width:imageWidth,
              height:imageHeight,
              type:videotagging.regiontype,
              tags:Object.keys(modelTags.classes).filter( (key) => {return modelTags.classes[key] === region.class }),
              name:(videotagging.frames[frameId].length + 1)
            }); 
          });
          }
        });
        videotagging.showAllRegions();

      //cleanup and notify
      $(".loader").remove();
      videotagging.video.currentTime = 0;
      videotagging.playingCallback();
      let notification = new Notification('Offline Video Tagger', { body: 'Model Ready For Review.' });

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

//optomize superRegionTracking 
function initRegionTracking () {
    videotagging.video.removeEventListener("canplay", initRegionTracking); //remove old listener
    trackingSuggestionsBlacklist = {};
    var regionsToTrack = [];
    
    $('#video-tagging').on("stepFwdClicked-BeforeStep", () => {
      videotagging.canMove = false;
      var regionCount = $('.regionCanvas').length;
      if (regionCount) {         
        var curFrame = videotagging.getCurrentFrame(),
            nxtFrame = curFrame + 1;
        //init store imagedata for scene detection
        var stanW = videotagging.video.videoWidth/videotagging.video.offsetWidth,
            stanH = videotagging.video.videoHeight/videotagging.video.offsetHeight;
        $.map($('.regionCanvas'), (regionCanvas, i) => { 
          //scale window to video 
          var w = Math.round(parseInt(regionCanvas.style.width) * stanW);
          var h = Math.round(parseInt(regionCanvas.style.height) * stanH);
          var y = Math.round(parseInt(regionCanvas.style.top) * stanH);
          var x = Math.round(parseInt(regionCanvas.style.left) * stanW);
          //get regionId
          var originalRegion = $.grep(videotagging.frames[curFrame], function(e){ return e.name == regionCanvas.id;})[0];
          //if region already exists in next frame don't track
          if (nxtFrame in videotagging.frames){
            var existingSuggestion = $.grep(videotagging.frames[nxtFrame], (e) => {
                if (!e.suggestedBy) return undefined;
                return e.suggestedBy.regionId == originalRegion.id; 
            }); 
            if (existingSuggestion && existingSuggestion.length > 0) {
              return;
            }
          }
          //if next frame is in blacklist don't track
          if (nxtFrame in trackingSuggestionsBlacklist) {
            if (trackingSuggestionsBlacklist[nxtFrame].has(originalRegion.id)) return;
          }
          //add region to be tracked 
          regionsToTrack.push({x,y,w,h,originalRegion});
        });
      }
    });

    $('#video-tagging').on("stepFwdClicked-AfterStep", () => {
        console.log(`${videotagging.getCurrentFrame()}, time: ${videotagging.video.currentTime}`);
        videotagging.video.addEventListener("canplay", afterStep);
    });  

    $('#video-tagging').on("canvasRegionDeleted", (e,deletedRegion) => {
       updateBlackList([deletedRegion]);
    });  

    $('#video-tagging').on("clearingAllRegions", () => {
       updateBlackList(videotagging.frames[videotagging.getCurrentFrame()]);
    });

    function afterStep() {
      videotagging.video.removeEventListener("canplay", afterStep);
      if (regionsToTrack.length) {
          var curFrame = videotagging.getCurrentFrame(),
              stanW = videotagging.video.offsetWidth/videotagging.video.videoWidth,
              stanH = videotagging.video.offsetHeight/videotagging.video.videoHeight;
          // pass regions to super tracking 
          superTracking(regionsToTrack).then( (suggestions) => {
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
                  x2 = Math.min(Math.round(suggestion.region.w * stanW) + x1, videotagging.video.offsetWidth),
                  y2 = Math.min(Math.round(suggestion.region.h * stanH) + y1, videotagging.video.offsetHeight);
                }
                // create new region
                videotagging.createRegion(x1, y1, x2, y2);
                videotagging.frames[curFrame][videotagging.frames[curFrame].length-1].tags = suggestion.originalRegion.tags;
                videotagging.frames[curFrame][videotagging.frames[curFrame].length-1].suggestedBy = {frameId:curFrame-1, regionId:suggestion.originalRegion.id};        
            });   
            regionsToTrack = [];
            videotagging.canMove = true;
          }).catch( (e) => {
              console.info(e);
              regionsToTrack = [];
              videotagging.canMove = true;
          });
      } else {
        videotagging.canMove =true;
      }
      
    }     

    function updateBlackList(removedRegions) {
      removedRegions.forEach( (deletedRegion) => {
        // add suggested by to black list for frame
        if(deletedRegion.suggestedBy !== undefined) {
          if(!trackingSuggestionsBlacklist[videotagging.getCurrentFrame()]){
            trackingSuggestionsBlacklist[videotagging.getCurrentFrame()] = new Set([deletedRegion.suggestedBy.regionId]);
          } else {
            trackingSuggestionsBlacklist[videotagging.getCurrentFrame()].add(deletedRegion.suggestedBy.regionId);
          } 
        }

        //if in the next frame remove from the next frames trackingSuggestionsBlacklist
        let nextFrameIndex = videotagging.getCurrentFrame() + 1;
        if (nextFrameIndex in trackingSuggestionsBlacklist){
          if (trackingSuggestionsBlacklist[nextFrameIndex].has(deletedRegion.id)) {
            trackingSuggestionsBlacklist[nextFrameIndex].delete(deletedRegion.id);
            //remove frame from blacklist if there is no entries in it
            if (trackingSuggestionsBlacklist[nextFrameIndex].size === 0)  delete trackingSuggestionsBlacklist[nextFrameIndex];
          }
        }
      });
    }    

    function superTracking(regions) {
      return new Promise((resolve, reject) => {

        supertrackingFrameRate = Math.max(supertrackingFrameRate,videotagging.framerate + 1);
        var video = document.createElement('video');
        video.src = videotagging.video.src;
        video.currentTime = videotagging.video.currentTime - (1/videotagging.framerate);
        video.oncanplay = init;    
        video.load();

        var cstracker = new regiontrackr.camshift.Tracker({whitebalancing : false, calcAngles : false});
        var tagging_duration, frameCanvas, canvasContext, scd, rcd;
        var suggestions = [];

        
        function init() {
          video.oncanplay = undefined;
          frameCanvas = document.createElement("canvas");
          frameCanvas.width = video.videoWidth;
          frameCanvas.height = video.videoHeight;
          canvasContext = frameCanvas.getContext("2d")
          canvasContext.drawImage(video, 0, 0);

          tagging_duration = Math.min(videotagging.video.currentTime , videotagging.video.duration);

          //detect if scene change
          scd = new SceneChangeDetector({ threshold:49, detectionRegion: { w:frameCanvas.width, h:frameCanvas.height } });
          scd.detectSceneChange(video, frameCanvas, canvasContext, videotagging.framerate).then( (sceneChanged) => {          
              if (!sceneChanged) {
                video.oncanplay = trackFrames;    
                console.log(video.currentTime);
                video.currentTime += (1/supertrackingFrameRate);          
              } else {
                reject("scene changed");
              }
          }).catch((e) => {console.info(e)});
        }

        function trackFrames() { 
          if (!regions.length) {
            resolve(suggestions);
          }
          var regionDetectionPromises = [];

          regions.forEach((region, i) => {
              // if first pass check whether the region changed
              if (region.regionChanged === undefined) {
                  rcd = new SceneChangeDetector({ threshold:1, detectionRegion: { w:region.w, h:region.h} });   
                  regionDetectionPromises.push(rcd.detectRegionChange(video, frameCanvas, region, i, videotagging.framerate));
              } else {
                if (region.regionChanged) {
                  trackRegion(region, i);
                }
              }                
          });  

          Promise.all(regionDetectionPromises).then((values) => {
             values.forEach ( (rp) => { //rp is resolved promise
                if (rp.regionChanged) {
                  trackRegion(rp.region, rp.index); 
                  regions[rp.index].regionChanged = rp.regionChanged; //make sure region change only executes once
                } else {
                  suggestions.push({type:"copy", region : rp.region, originalRegion: rp.region.originalRegion});
                  delete regions[rp.index];
                }
              });
              if (video.currentTime >= tagging_duration) {
                video.oncanplay = undefined;    
                resolve(suggestions);
              } else { 
                console.log(video.currentTime);
                video.currentTime += (1 / supertrackingFrameRate);//go to next frame segment
              }
          },(e)=>{console.info(e);});

        }
        function trackRegion(region, i) {   
            //on exit condition push to suggestions
            if (video.currentTime >= tagging_duration) {
              if (region.trackedObject) {
                suggestions.push( {type:"tracked", region:{x : region.trackedObject.x, y : region.trackedObject.y, w : region.w, h: region.h}, originalRegion: region.originalRegion});
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
