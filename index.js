const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const pathJS = require('path');
const fs = require('fs');
const ipcRenderer = require('electron').ipcRenderer;

var furthestVisitedFrame; //keep track of the furthest visited frame
var videotagging;

document.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if(e.dataTransfer.files[0].type == "video/mp4") {
      fileSelected(e.dataTransfer.files[0]);
    }
    return false;
});

document.addEventListener('dragover', function (e) {
    e.preventDefault();
    if(e.dataTransfer.files[0].type == "video/mp4") {
      e.dataTransfer.dropEffect = "copy";
    }
    e.stopPropagation();
});

document.addEventListener('dragstart', function (e) {
    e.preventDefault();
    if(e.dataTransfer.files[0].type == "video/mp4") {
      e.dataTransfer.effectAllowed = "copy";
    }
    e.stopPropagation();
});

// stop zooming
document.addEventListener('mousewheel', function(e) {
  if(e.ctrlKey) {
    e.preventDefault();
  }
});

function updateFurthestVisitedFrame(){
    var currentFrame = videotagging.getCurrentFrame();
    if (furthestVisitedFrame < currentFrame) furthestVisitedFrame = currentFrame;
}

function checkPointRegion() {
    if (document.getElementById('regiontype').value != "Point") {
      document.getElementById('regionPointGroup').style.display = "none";
    }
    else {
      document.getElementById('regionPointGroup').style.display = "inline";
    }
}

ipcRenderer.on('openVideo', function(event, message) {
  fileSelected();
});

ipcRenderer.on('saveVideo', function(event, message) {
  save();
});

ipcRenderer.on('exportCNTK', function(event, message) {
  exportCNTK();
});


function fileSelected(path) {
  document.getElementById('load-message').style.display = "none";

  if(path) {  //checking if a video is dropped
    let pathName = [path.path];
    openPath(path.path);
  } else { // showing system open dialog
    dialog.showOpenDialog({
      filters: [{ name: 'Videos', extensions: ['mp4']}],
      properties: ['openFile']
    },
    function (pathName) {
      if (pathName) openPath(pathName[0]);
      else document.getElementById('load-message').style.display = "inline";
    });
  }

  function openPath(pathName) {
    var config;

    document.getElementById('video-tagging-container').style.display = "none";
    document.getElementById('load-message').style.display = "none";
    document.getElementById('load-form-container').style.display = "block";
    document.getElementById('framerateGroup').style.display = "inline";
    //set title indicator
    $('title').text(`Video Tagging Job Configuration: ${pathJS.basename(pathName, pathJS.extname(pathName))}`);
    
    $('#inputtags').tagsinput('removeAll');//remove all previous tag labels

    try{
      config = require(`${pathName}.json`);
      document.getElementById('MultiRegions').checked = config.multiRegions;
      //restore tags
      document.getElementById('inputtags').value = config.inputTags;
      config.inputTags.split(",").forEach(function(tag) {
          $("#inputtags").tagsinput('add',tag);
      });
    } catch (e){
      console.log(`Error loading save file ${e.message}`);
    }
    
    document.getElementById('loadButton').parentNode.replaceChild(document.getElementById('loadButton').cloneNode(true), document.getElementById('loadButton'));
    document.getElementById('loadButton').addEventListener('click', loadTagger);
    function loadTagger (e) {

      videotagging = document.getElementById('video-tagging');
      videotagging.regiontype = document.getElementById('regiontype').value;
      videotagging.multiregions = document.getElementById('MultiRegions').checked ? "1":"0";
      videotagging.regionsize = document.getElementById('regionsize').value;
      videotagging.inputtagsarray = document.getElementById('inputtags').value.split(',');

      videotagging.video.currentTime = 0;

      if(config) videotagging.inputframes = config.frames;
      else videotagging.inputframes = {};

      videotagging.framerate = document.getElementById('framerate').value;
      //set title indicator
      $('title').text(`Video Tagging Job: ${pathJS.basename(pathName, pathJS.extname(pathName))}`);
      videotagging.src = pathName;//load

      //track furthestVisitedFrame
      furthestVisitedFrame = 1;
      videotagging.video.removeEventListener("canplaythrough", updateFurthestVisitedFrame); //remove old listener
      videotagging.video.addEventListener("canplaythrough",updateFurthestVisitedFrame);

      //init region tracking
      videotagging.video.addEventListener("canplaythrough",  initRegionTracking);

      document.getElementById('load-form-container').style.display = "none";
      document.getElementById('video-tagging-container').style.display = "block";

      console.log(pathName);

      ipcRenderer.send('setFilePath', pathName);

    }
  }
}




function save() {
    var saveObject = {
      "frames" : videotagging.frames,
      "inputTags": document.getElementById('inputtags').value,
      "multiRegions": document.getElementById('MultiRegions').checked,
      "furthestVisitedFrame": furthestVisitedFrame
    };
    
    fs.writeFileSync(`${videotagging.src}.json`, JSON.stringify(saveObject));

    let notification = new Notification('Offline Video Tagger', {
      body: 'Successfully saved metadata in ' + `${videotagging.src}.json`
    });
}

function exportCNTK() {

  $("<div class=\"loader\"></div>").appendTo($("#videoWrapper"));

  //make sure paths exist
  if (!fs.existsSync(`${basepath}/cntk`)) fs.mkdirSync(`${basepath}/cntk`);
  var framesPath = `${basepath}/cntk/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}_frames`;

  if (!fs.existsSync(framesPath)) fs.mkdirSync(framesPath);
  if (!fs.existsSync(`${framesPath}/positive`)) fs.mkdirSync(`${framesPath}/positive`);
  if (!fs.existsSync(`${framesPath}/negative`)) fs.mkdirSync(`${framesPath}/negative`);

  //init canvas buffer
  var frameCanvas = document.createElement("canvas");
  frameCanvas.width = videotagging.video.videoWidth;
  frameCanvas.height = videotagging.video.videoHeight;
  var canvasContext = frameCanvas.getContext("2d");

  // start exporting frames using the canplaythrough eventListener
  videotagging.video.removeEventListener("canplaythrough", updateFurthestVisitedFrame); //stop recording frame movment
  videotagging.video.addEventListener("canplaythrough", saveFrames);
  videotagging.video.currentTime = 0;
  videotagging.playingCallback();

  function saveFrames(){

    var frameId = videotagging.getCurrentFrame();
    //if last frame removeEventListener and loader
    if (( frameId >= furthestVisitedFrame) ) {
      videotagging.video.removeEventListener("canplaythrough", saveFrames);
      videotagging.video.addEventListener("canplaythrough", updateFurthestVisitedFrame);
      $(".loader").remove();
    }

    //set default writepath to the negative folder
    var writePath = `${framesPath}/negative/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}_frame_${frameId}.jpg`; //defaults to negative
    var positiveWritePath = `${framesPath}/positive/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}_frame_${frameId}.jpg`;
    //If frame contains tags generate the metadata and save it in the positive directory
    var frameIsTagged = videotagging.frames.hasOwnProperty(frameId) && (videotagging.frames[frameId].length > 0);
    if (frameIsTagged && (videotagging.getUnlabeledRegionTags(frameId).length != videotagging.frames[frameId].length)){
        //clear metadata if image exists from last run
        if(fs.existsSync(writePath))fs.unlinkSync(writePath);
        if(fs.existsSync(positiveWritePath)){
          // checking to see if no tags were saved from last run
          if(fs.existsSync(positiveWritePath.replace('.jpg', '.bboxes.labels.tsv'))) {
            fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.labels.tsv'));
          }
          if(fs.existsSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'))) {
            fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'));
          }
        }
        //genereate metadata from tags
        videotagging.frames[frameId].map(function(tag){
              if (!tag.tags[tag.tags.length-1]) {
                return console.log(`frame ${frameId} region ${tag.name} has no label`);
              }
              var stanW = videotagging.video.videoWidth/tag.width;
              var stanH = videotagging.video.videoHeight/tag.height;
              fs.appendFile(positiveWritePath.replace('.jpg', '.bboxes.labels.tsv'), `${tag.tags[tag.tags.length-1]}\n`, function (err) {});
              fs.appendFile(positiveWritePath.replace('.jpg', '.bboxes.tsv'), `${parseInt(tag.x1 * stanW)}\t${parseInt(tag.y1 * stanH)}\t${parseInt(tag.x2 * stanW)}\t${parseInt(tag.y2 * stanH)}\n`, function (err) {});
        });

        writePath = positiveWritePath; // set write path to positve write path
    }
    else if(fs.existsSync(positiveWritePath)){ //tags have been removed clear positive data if itexists from last run
        fs.unlinkSync(positiveWritePath);
        fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'));
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
    if (frameId < furthestVisitedFrame) {
      videotagging.stepFwdClicked(false);

    } else {
      let notification = new Notification('Offline Video Tagger', {
          body: 'Successfully exported CNTK files.'
      });
    }
  }
}

function initRegionTracking() {

    videotagging.video.removeEventListener("canplaythrough", initRegionTracking); //remove old listener

    var frameCanvas = document.createElement("canvas"),
    canvasContext = frameCanvas.getContext("2d"),
    scd = new SceneChangeDetector({threshold:60, detectionRegion:{w:frameCanvas.width, h:frameCanvas.height}}),
    trackersStack = [],
    prevImage, prevFrameId;
    
    //set canvas dimensions
    frameCanvas.width = videotagging.video.offsetWidth;
    frameCanvas.height = videotagging.video.offsetHeight;

    $('#video-tagging').on("stepFwdClicked-BeforeStep",function() {

      if ($('.regionCanvas').length > 0) {         
        //init store imagedata for scene detection
        canvasContext.drawImage(videotagging.video, 0, 0);
        prevFrameId = videotagging.getCurrentFrame();    
        prevImage = canvasContext.getImageData(0, 0, frameCanvas.width, frameCanvas.height).data;

        $.map($('.regionCanvas'), function(regionCanvas) {  
          var w = parseInt(regionCanvas.style.width);
          var h = parseInt(regionCanvas.style.height);
          var y = parseInt(regionCanvas.style.top);
          var x = parseInt(regionCanvas.style.left);
          //init and push the region tracker
          var cstracker = new regiontrackr.camshift.Tracker({whitebalancing : false,calcAngles:false});
          cstracker.initTracker(frameCanvas, new regiontrackr.camshift.Rectangle(x,y,w,h));
          var prevRegion = $.grep(videotagging.frames[prevFrameId], function(e){ return e.name == regionCanvas.id;})[0];
          trackersStack.push({cstracker: cstracker, prevTags: prevRegion.tags, prevRegionId: prevRegion.id});
        });
      }
    });

    $('#video-tagging').on("stepFwdClicked-AfterStep",function(){
        videotagging.video.addEventListener("canplaythrough", afterStep);
    });  

    function afterStep() {
      videotagging.video.removeEventListener("canplaythrough", afterStep);

      
      function suggestionExists(e) {
          if (!e.suggestedBy) return undefined;
          return e.suggestedBy.regionId == tracker.prevRegionId; 
      }
      
      //to do pop the stack make the reccomendations
        while(trackersStack.length > 0 && prevImage) {
          //caputure new frame
          canvasContext.drawImage(videotagging.video, 0, 0);
          var curImage = canvasContext.getImageData(0, 0, frameCanvas.width, frameCanvas.height).data;
          //break if scene changes
          if (scd.detectSceneChange(prevImage, curImage)) break;
          //apply camshift here 
          var tracker = trackersStack.pop();
          tracker.cstracker.track(frameCanvas);
          var trackedObject = tracker.cstracker.getTrackObj();        
          //if object has disapeared don't add a new region
          if (trackedObject.width === 0 || trackedObject.height === 0 ) continue;
          //get bounding box of tracked object
          var tx1 = Math.max(Math.floor((trackedObject.x - trackedObject.width/2) ), 0);
          var ty1 = Math.max(Math.floor((trackedObject.y - trackedObject.height/2)), 0);
          var tx2 = Math.min(Math.floor((trackedObject.width + tx1)), videotagging.video.offsetWidth);
          var ty2 = Math.min(Math.floor((trackedObject.height + ty1)), videotagging.video.offsetHeight);
          // don't create a new region if a suggestion already exists
          var currentFrameId = videotagging.getCurrentFrame();
          if (videotagging.frames[currentFrameId]){
            var existingSuggestion = $.grep(videotagging.frames[currentFrameId], suggestionExists); 
            if (existingSuggestion && existingSuggestion.length > 0) {
              continue;
            }
          }
          //create new region
          videotagging.createRegion( tx1,ty1,tx2,ty2);   
          videotagging.frames[currentFrameId][videotagging.frames[currentFrameId].length-1].tags = tracker.prevTags;
          videotagging.frames[currentFrameId][videotagging.frames[currentFrameId].length-1].suggestedBy = {frameId:prevFrameId, regionId:tracker.prevRegionId};                   
        }

        prevImage = prevFrameId = undefined;
        trackersStack = []; 
    }            
}
