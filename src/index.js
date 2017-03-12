const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const pathJS = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const cntkModel= require('cntk-fastrcnn');
const cntkDefaultPath = 'c:/local/cntk';
const ipcRenderer = require('electron').ipcRenderer;
var supertrackingFrameRate = 10;
var trackingEnabled = true;
var visitedFrames, //keep track of the visited frames
    videotagging,
    CNTKExtension; 

//ipc rendering
ipcRenderer.on('openVideo', (event, message) => {
  fileSelected();
});

ipcRenderer.on('saveVideo', (event, message) => {
  save();
  let notification = new Notification('Offline Video Tagger', {
   body: 'Successfully saved metadata in ' + `${videotagging.src}.json`
  });
});

ipcRenderer.on('exportCNTK', (event, message) => {
  addLoader();
  CNTKExtension.exportCNTK(removeLoader);
});

ipcRenderer.on('reviewCNTK', (event, message) => {
    if (fs.existsSync(cntkDefaultPath)) {
        var modelLocation = $('#model').val();
        if (fs.existsSync(modelLocation)) {
          reviewCNTK();
        } else {
            alert(`No model found! Please make sure you put your model in the following directory: ${modelLocation}`)
        }
        
    } else {
      alert("This feature isn't supported by your system please check your CNTK configuration and try again later.");
    }
});

ipcRenderer.on('toggleTracking', (event, message) => {
  $('#video-tagging').off("stepFwdClicked-BeforeStep");
  if (trackingEnabled) {
      $('#video-tagging').off("stepFwdClicked-AfterStep");
      //add event to prevent non tracked regions from giving suggestions
      $('#video-tagging').on("stepFwdClicked-BeforeStep", () => {
          save();
          var regionCount = $('.regionCanvas').length;
          if (regionCount) {         
            var curFrame = videotagging.getCurrentFrame();
            $.map($('.regionCanvas'), (regionCanvas, i) => { 
              //get regionId
              for (regInd = 0; regInd < videotagging.frames[curFrame].length; regInd++) {
                if (videotagging.frames[curFrame][regInd].name = regionCanvas.id) {
                  videotagging.frames[curFrame][regInd].blockSuggest = true;
                }
              }
            });
          }
      });


  } else {
      videotagging.video.addEventListener("canplay",  initRegionTracking);
  } 
  trackingEnabled = !trackingEnabled;

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

function removeLoader() {
   $(".loader").remove();
}

//managed the visited frames
function updateVisitedFrames(){
  visitedFrames.add(videotagging.getCurrentFrame());
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
    $('#output').val(`${basepath}/cntk`);
    $('#model').val(`${basepath}/cntk/Fast-RCNN.model`);

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
      if(framerate.validity.valid && inputtags.validity.valid) {
        $('.bootstrap-tagsinput').last().removeClass( "invalid" );
       
        $('title').text(`Video Tagging Job: ${pathJS.basename(pathName, pathJS.extname(pathName))}`); //set title indicator

        videotagging = document.getElementById('video-tagging'); //find out why jquery doesn't play nice with polymer
        videotagging.regiontype = $('#regiontype').val();
        videotagging.multiregions = 1;
        videotagging.regionsize = $('#regionsize').val();
        videotagging.inputtagsarray = $('#inputtags').val().split(',');
        videotagging.video.currentTime = 0;
        videotagging.framerate = $('#framerate').val();

        if (config) {
          videotagging.inputframes = config.frames;
          visitedFrames = new Set(config.visitedFrames);
        } else {
            videotagging.inputframes = {};
            visitedFrames = new Set();
        } 

        videotagging.src = ''; // ensures reload if user opens same video 
        videotagging.src = pathName;
        
        //set start time
        videotagging.video.oncanplay = function (){
            videotagging.videoStartTime = videotagging.video.currentTime;
            videotagging.video.oncanplay = undefined;
        }

        //track visited frames
        videotagging.video.removeEventListener("canplay", updateVisitedFrames); //remove old listener
        videotagging.video.addEventListener("canplay",updateVisitedFrames);

        //init cntk extensions
        CNTKExtension = new VideoTaggingCNTKExtension({
            videotagging: videotagging,
            visitedFrames: visitedFrames,
            exportUntil : $('#exportTo').val(),
            exportPath : $('#output').val()
        });

        //init region tracking
        videotagging.video.addEventListener("canplay",  initRegionTracking);

        $('#load-form-container').hide();
        $('#video-tagging-container').show();

        ipcRenderer.send('setFilePath', pathName);
      } else {
        $('.bootstrap-tagsinput').last().addClass( "invalid" );
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
      "visitedFrames": Array.from(visitedFrames),
    };
    
    fs.writeFileSync(`${videotagging.src}.json`, JSON.stringify(saveObject));
}

//optomize superRegionTracking 
function initRegionTracking () {
    videotagging.video.removeEventListener("canplay", initRegionTracking); //remove old listener
    $('#video-tagging').off("stepFwdClicked-BeforeStep");
    $('#video-tagging').off("stepFwdClicked-AfterStep");
    var regionsToTrack = [];
    
    $('#video-tagging').on("stepFwdClicked-BeforeStep", () => {
      save();
      videotagging.canMove = false;
      var regionCount = $('.regionCanvas').length;
      if (regionCount) {         
        var curFrame = videotagging.getCurrentFrame();
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
          //if region is in blacklist don't track
          if (originalRegion.blockSuggest) return;
          //add region to be tracked 
          regionsToTrack.push({x,y,w,h,originalRegion});
        });
      }
    });

    $('#video-tagging').on("stepFwdClicked-AfterStep", () => {
        videotagging.video.addEventListener("canplay", afterStep);
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
                // add suggested by to previous region to blacklist
                videotagging.frames[curFrame-1][suggestion.originalRegion.name-1].blockSuggest = true;
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
                video.currentTime += (1/supertrackingFrameRate);          
              } else {
                reject("scene changed");
              }
          }).catch((e) => {console.info(e)});
        }

        function trackFrames() { 
          if (!regions.length) {
            video.oncanplay = undefined;    
            return resolve(suggestions);
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