const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const pathJS = require('path');
const fs = require('fs');
const cntkModel= require('cntk-fastrcnn');
const modelFileLocation = `${basepath}/Fast-RCNN.model`;
const ipcRenderer = require('electron').ipcRenderer;

var furthestVisitedFrame; //keep track of the furthest visited frame
var videotagging;
var trackingSuggestionsBlacklist; //keep track of deleted suggestions

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

//adds a loading animation to the tagger
function addLoader() {
  if($('.loader').length == 0) {
    $("<div class=\"loader\"></div>").appendTo($("#videoWrapper"));
  }
}

//managed the furthest visited frame
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

ipcRenderer.on('reviewCNTK', function(event, message) {
    if (fs.existsSync(`c:/local/cntk`)) {
        if (fs.existsSync(modelFileLocation)){
          reviewCNTK();
        } else{
            alert(`No model found! Please make sure you put your model in the following directory: ${modelFileLocation}`)
        }
        
    } else {
      alert("This feature isn't supported by your system please check your CNTK configuration and try again later.");
    }
});

//load logic
function fileSelected(path) {
  document.getElementById('load-message').style.display = "none";

  if(path) {  //checking if a video is dropped
    let pathName = path.path;
    openPath(pathName);
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
      videotagging.multiregions = 1;
      videotagging.regionsize = document.getElementById('regionsize').value;
      videotagging.inputtagsarray = document.getElementById('inputtags').value.split(',');

      videotagging.video.currentTime = 0;

      if(config) videotagging.inputframes = config.frames;
      else videotagging.inputframes = {};

      videotagging.framerate = document.getElementById('framerate').value;
      //set title indicator
      $('title').text(`Video Tagging Job: ${pathJS.basename(pathName, pathJS.extname(pathName))}`);
      videotagging.src = pathName;
      videotagging.video.load();//load video

      //track furthestVisitedFrame
      furthestVisitedFrame = 1;
      videotagging.video.removeEventListener("canplaythrough", updateFurthestVisitedFrame); //remove old listener
      videotagging.video.addEventListener("canplaythrough",updateFurthestVisitedFrame);

      //init region tracking
      videotagging.video.addEventListener("canplaythrough",  initRegionTracking);

      document.getElementById('load-form-container').style.display = "none";
      document.getElementById('video-tagging-container').style.display = "block";

      ipcRenderer.send('setFilePath', pathName);
      videotagging.video.addEventListener("loadedmetadata", function() {
        var videoSize = [videotagging.video.videoWidth, videotagging.video.videoHeight]
        ipcRenderer.send('setWindowSize', videoSize);
      });
    }
  }
}

//saves current video to config 
function save() {
    var saveObject = {
      "frames" : videotagging.frames,
      "inputTags": document.getElementById('inputtags').value,
      "exportTo": document.getElementById('exportTo').value,
      "furthestVisitedFrame": furthestVisitedFrame
    };
    
    fs.writeFileSync(`${videotagging.src}.json`, JSON.stringify(saveObject));

    let notification = new Notification('Offline Video Tagger', {
      body: 'Successfully saved metadata in ' + `${videotagging.src}.json`
    });
}

//maps every frame in the video to an imageCanvas
function mapVideo(exportUntil,cb) {
   return new Promise(function(resolve, reject) {
    //init canvas buffer
    var frameCanvas = document.createElement("canvas");
    frameCanvas.width = videotagging.video.videoWidth;
    frameCanvas.height = videotagging.video.videoHeight;
    var canvasContext = frameCanvas.getContext("2d");

    // start exporting frames using the canplaythrough eventListener
    videotagging.video.removeEventListener("canplaythrough", updateFurthestVisitedFrame); //stop recording frame movment
    videotagging.video.addEventListener("canplaythrough", iterateFrames);
    videotagging.video.currentTime = 0;
    videotagging.playingCallback();

    function iterateFrames(){
      var frameId = videotagging.getCurrentFrame();
      var isLastFrame;

      switch(exportUntil) {
          case "tagged":
              isLastFrame = (Object.keys(videotagging.frames).length == 0) || (frameId >= parseInt(Object.keys(videotagging.frames)[Object.keys(videotagging.frames).length-1]));
              break;
          case "visited":
              isLastFrame = (frameId >= furthestVisitedFrame);        
              break;
          case "last":
              isLastFrame = (videotagging.video.currentTime >= videotagging.video.duration);
              break;
      }
      if(isLastFrame) {
        videotagging.video.removeEventListener("canplaythrough", iterateFrames);
        videotagging.video.addEventListener("canplaythrough", updateFurthestVisitedFrame);
        resolve();
      }
      cb(frameId,frameCanvas,canvasContext);
      if (!isLastFrame) {
        videotagging.stepFwdClicked(false);
      } 
    }
  });
}

//exports frames to cntk format for model training
function exportCNTK() {
  addLoader();

  //make sure paths exist
  if (!fs.existsSync(`${basepath}/cntk`)) fs.mkdirSync(`${basepath}/cntk`);
  var framesPath = `${basepath}/cntk/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}_frames`;

  if (!fs.existsSync(framesPath)) fs.mkdirSync(framesPath);
  if (!fs.existsSync(`${framesPath}/positive`)) fs.mkdirSync(`${framesPath}/positive`);
  if (!fs.existsSync(`${framesPath}/negative`)) fs.mkdirSync(`${framesPath}/negative`);

  mapVideo(document.getElementById('exportTo').value,exportFrame).then(function(){
      $(".loader").remove();
      let notification = new Notification('Offline Video Tagger', {
          body: 'Successfully exported CNTK files.'
      });
  })

  function exportFrame(frameId,frameCanvas,canvasContext) {

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
    else if(fs.existsSync(positiveWritePath)){ //tags have been removed clear positive data if it exists from last run
        fs.unlinkSync(positiveWritePath);
        if(fs.existsSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'))) fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.tsv'));
        if(fs.existsSync(positiveWritePath.replace('.jpg', '..bboxes.labels.tsv'))) fs.unlinkSync(positiveWritePath.replace('.jpg', '.bboxes.labels.tsv'));
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

    var modelTagsPromise = new Promise(function(resolve, reject) { 
      model.evaluateDirectory(reviewPath, function (err, res) {
        if (err) {
            console.info(err);
            reject();
        }
        resolve(res);
      });
    });
    modelTagsPromise.then(function(modelTags) {
      videotagging.video.removeEventListener("canplaythrough", initRegionTracking); //remove region tracking listener
      $('#video-tagging').off("stepFwdClicked-BeforeStep" );
      $('#video-tagging').off("stepFwdClicked-AfterStep" );
      videotagging.frames=[];
      videotagging.optionalTags.createTagControls(Object.keys(modelTags.classes));

      //Create regions based on the provided modelTags
      Object.keys(modelTags.frames).map(function(pathId){
          var frameImage = new Image();
          frameImage.src = `${reviewPath}\\${pathId}`;
          frameImage.onload = loadFrameRegions; 

          function loadFrameRegions(){
            var imageWidth = this.width;
            var imageHeight = this.height;
            frameId = pathId.replace(".jpg", "");//remove.jpg
            videotagging.frames[frameId] = [];
            modelTags.frames[pathId].regions.forEach(function(region) {
              videotagging.frames[frameId].push({
                x1:region.x1,
                y1:region.y1,
                x2:region.x2,
                y2:region.y2,                          
                id:videotagging.uniqueTagId++,
                width:imageWidth,
                height:imageHeight,
                type:videotagging.regiontype,
                tags:Object.keys(modelTags.classes).filter(function(key) {return modelTags.classes[key] === region.class }),
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
      let notification = new Notification('Offline Video Tagger', {body: 'Model Ready For Review.'});

    });
  }

  function saveFrame(frameId,fCanvas,canvasContext){
    canvasContext.drawImage(videotagging.video, 0, 0);
    var writePath = reviewPath+ `/${frameId}.jpg`
    var data = fCanvas.toDataURL('image/jpeg').replace(/^data:image\/\w+;base64,/, ""); // strip off the data: url prefix to get just the base64-encoded bytes http://stackoverflow.com/questions/5867534/how-to-save-canvas-data-to-file
    var buf = new Buffer(data, 'base64');
    //write canvas to file and change frame
    console.log('saving file', writePath);
    if(!fs.existsSync(writePath)) {
      fs.writeFileSync(writePath, buf);
    }
   
  }

}

//enables tracking
function initRegionTracking() {

    trackingSuggestionsBlacklist = {};
    videotagging.video.removeEventListener("canplaythrough", initRegionTracking); //remove old listener

    var frameCanvas = document.createElement("canvas"),
    canvasContext = frameCanvas.getContext("2d"),
    scd = new SceneChangeDetector({threshold:49, detectionRegion:{w:frameCanvas.width, h:frameCanvas.height}}),
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

    $('#video-tagging').on("stepFwdClicked-AfterStep",function() {
        videotagging.video.addEventListener("canplaythrough", afterStep);
    });  

    $('#video-tagging').on("canvasRegionDeleted", function(e,deletedRegion) {
       updateBlackList([deletedRegion]);
    });  

    $('#video-tagging').on("clearingAllRegions", function(){
       updateBlackList(videotagging.frames[this.getCurrentFrame()]);
    });

    function afterStep() {
      videotagging.video.removeEventListener("canplaythrough", afterStep);

      function suggestionExists(e) {
          if (!e.suggestedBy) return undefined;
          return e.suggestedBy.regionId == tracker.prevRegionId; 
      }
      var currentFrameId = videotagging.getCurrentFrame();
      if ((currentFrameId !== prevFrameId) &&  prevImage) {
        if (!videotagging.frames[currentFrameId]) videotagging.frames[currentFrameId] =[];
        //to do pop the stack make the reccomendations
        while(trackersStack.length > 0) {
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
            if (currentFrameId in videotagging.frames){
              var existingSuggestion = $.grep(videotagging.frames[currentFrameId], suggestionExists); 
              if (existingSuggestion && existingSuggestion.length > 0) continue;
            }
            //don't create a region if its in the trackingSuggestionsBlacklist
            if (currentFrameId in trackingSuggestionsBlacklist){
              if (trackingSuggestionsBlacklist[currentFrameId].has(tracker.prevRegionId)) continue;
            }
            //create new region
            videotagging.createRegion(tx1,ty1,tx2,ty2);
        }
      }
      prevImage = prevFrameId = undefined;
      trackersStack = []; 
    }      

    function updateBlackList(removedRegions) {
      removedRegions.forEach(function(deletedRegion) {
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
}