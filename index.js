const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const pathJS = require('path');
const fs = require('fs');
const cntkModel= require('cntk-fastrcnn');
const cntkDefaultPath = 'c:/local/cntk';
const modelFileLocation = `${basepath}/Fast-RCNN.model`;
const ipcRenderer = require('electron').ipcRenderer;

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
        videotagging.video.load();//load video

        //track furthestVisitedFrame
        furthestVisitedFrame = 1;
        videotagging.video.removeEventListener("canplaythrough", updateFurthestVisitedFrame); //remove old listener
        videotagging.video.addEventListener("canplaythrough",updateFurthestVisitedFrame);

        //init region tracking
        videotagging.video.addEventListener("canplaythrough",  initSuperRegionTracking);

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

    // start exporting frames using the canplaythrough eventListener
    videotagging.video.removeEventListener("canplaythrough", updateFurthestVisitedFrame); //stop recording frame movment
    videotagging.video.addEventListener("canplaythrough", iterateFrames);
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
        videotagging.video.removeEventListener("canplaythrough", iterateFrames);
        videotagging.video.addEventListener("canplaythrough", updateFurthestVisitedFrame);
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
      videotagging.video.removeEventListener("canplaythrough", initRegionTracking); //remove region tracking listener
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

//enables tracking
function initRegionTracking() {
    trackingSuggestionsBlacklist = {};
    videotagging.video.removeEventListener("canplaythrough", initRegionTracking); //remove old listener

    var frameCanvas = document.createElement("canvas"),
    canvasContext = frameCanvas.getContext("2d"),
    scd = new SceneChangeDetector({ threshold:49, detectionRegion: { w:frameCanvas.width, h:frameCanvas.height } }),
    trackersStack = [],
    prevImage, prevFrameId;
    
    //set canvas dimensions
    frameCanvas.width = videotagging.video.videoWidth;
    frameCanvas.height = videotagging.video.videoHeight;

    $('#video-tagging').on("stepFwdClicked-BeforeStep", () => {

      if ($('.regionCanvas').length) {         
        //init store imagedata for scene detection
        canvasContext.drawImage(videotagging.video, 0, 0);
        prevFrameId = videotagging.getCurrentFrame();    
        prevImage = canvasContext.getImageData(0, 0, frameCanvas.width, frameCanvas.height).data;

        var stanW = frameCanvas.width/videotagging.video.offsetWidth;
        var stanH = frameCanvas.height/videotagging.video.offsetHeight;

        console.log (`Before stanH ${stanH}, stanW ${stanW}`);

        $.map($('.regionCanvas'), (regionCanvas) => {  
          var w = Math.round(parseInt(regionCanvas.style.width) * stanW);
          var h = Math.round(parseInt(regionCanvas.style.height) * stanH);
          var y = Math.round(parseInt(regionCanvas.style.top) * stanH);
          var x = Math.round(parseInt(regionCanvas.style.left) * stanW);

          var prevCords ={"w":w, "h":h ,"y":y, "x":x};
          var prevRegionImage =  canvasContext.getImageData(x,y,w,h).data;
          
          //init and push the region tracker
          var cstracker = new regiontrackr.camshift.Tracker({whitebalancing : false, calcAngles : false});
          cstracker.initTracker(frameCanvas, new regiontrackr.camshift.Rectangle(x,y,w,h));
          var prevRegion = $.grep(videotagging.frames[prevFrameId], function(e){ return e.name == regionCanvas.id;})[0];
          trackersStack.push({cstracker: cstracker, prevTags: prevRegion.tags, prevRegionId: prevRegion.id, prevCords:prevCords ,prevRegionImage:prevRegionImage});

        });
      }
    });

    $('#video-tagging').on("stepFwdClicked-AfterStep", () => {
        videotagging.video.addEventListener("canplaythrough", afterStep);
    });  

    $('#video-tagging').on("canvasRegionDeleted", (e,deletedRegion) => {
       updateBlackList([deletedRegion]);
    });  

    $('#video-tagging').on("clearingAllRegions", () => {
       updateBlackList(videotagging.frames[videotagging.getCurrentFrame()]);
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
        while(trackersStack.length) {
            //caputure new frame
            canvasContext.drawImage(videotagging.video, 0, 0);
            var curImage = canvasContext.getImageData(0, 0, frameCanvas.width, frameCanvas.height).data;
            //break if scene changes
            if (scd.detectChange(prevImage, curImage)) break;
            //apply camshift here 
            var tracker = trackersStack.pop();

            var tx1,ty1,tx2,ty2;

            //check if region is in lower threshold bounds before tracking
            regionChangeDectector = new SceneChangeDetector({ threshold:10, detectionRegion: { w:tracker.prevCords.w, h:tracker.prevCords.h} });
            var curRegionImage = canvasContext.getImageData(tracker.prevCords.x,tracker.prevCords.y, tracker.prevCords.w, tracker.prevCords.h).data; 
            
            //create standardization vars
            var stanW =  videotagging.video.offsetWidth/frameCanvas.width; 
            var stanH = videotagging.video.offsetHeight/frameCanvas.height;
            if (regionChangeDectector.detectSceneChange(tracker.prevRegionImage,curRegionImage)) {
                //track
                tracker.cstracker.track(frameCanvas);
                var trackedObject = tracker.cstracker.getTrackObj();  


                //debug
                debugCamshift(tracker.cstracker,tracker.prevRegionId);
                // console.info(trackedObject);      
                //if object has disapeared don't add a new region
                if (trackedObject.width === 0 || trackedObject.height === 0 ) continue;

                
                //get bounding box of tracked object
                tx1 = Math.max(Math.round(trackedObject.x*stanW) - Math.round((tracker.prevCords.w*stanW)/2), 0);
                ty1 = Math.max(Math.round(trackedObject.y*stanH)  - Math.round((tracker.prevCords.h*stanH)/2), 0);
                tx2 = Math.min(Math.round(tracker.prevCords.w*stanW)  + tx1, videotagging.video.offsetWidth);
                ty2 = Math.min(Math.round(tracker.prevCords.h*stanH) + ty1, videotagging.video.offsetHeight);

                //check if suggestion is not a match  is out of higher threshold bounds
                mismatchChangeDectector = new SceneChangeDetector({ threshold:60, detectionRegion: { w:tracker.prevCords.w, h:tracker.prevCords.h} });
                var trackImage = canvasContext.getImageData(trackedObject.x - tracker.prevCords.w/2, trackedObject.y - tracker.prevCords.h/2, tracker.prevCords.w, tracker.prevCords.h).data;
              //  if (mismatchChangeDectector.detectSceneChange(tracker.prevRegionImage,trackImage)) continue;

            } else{

               console.log (`after stanH ${stanH}, stanW ${stanW}`);
               tx1 = Math.round(tracker.prevCords.x * stanW);
               ty1 = Math.round(tracker.prevCords.y * stanH);
               tx2 = tx1 + Math.round(tracker.prevCords.w * stanW);
               ty2 = ty1 + Math.round(tracker.prevCords.h * stanH);
               console.info(tracker.prevCords);

               console.log({"x1":tx1, "y1":ty1 ,"x2":tx2, "y2":ty2});

            }
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
            videotagging.frames[currentFrameId][videotagging.frames[currentFrameId].length-1].tags = tracker.prevTags;
            videotagging.frames[currentFrameId][videotagging.frames[currentFrameId].length-1].suggestedBy = {frameId:prevFrameId, regionId:tracker.prevRegionId};                   

        }
      }
      prevImage = prevFrameId = undefined;
      trackersStack = []; 
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
}


//superRegionTracking 

function initSuperRegionTracking () {
    videotagging.video.removeEventListener("canplaythrough", initSuperRegionTracking); //remove old listener
    trackingSuggestionsBlacklist = {};
    var prevFrameId;
    var suggestionStack = [];

    var d = $.Deferred();
    
    $('#video-tagging').on("stepFwdClicked-BeforeStep", () => {
      var regionCount = $('.regionCanvas').length;
      if (regionCount) {         

        //init store imagedata for scene detection
        var stanW = videotagging.video.videoWidth/videotagging.video.offsetWidth;
        var stanH = videotagging.video.videoHeight/videotagging.video.offsetHeight;

        $.map($('.regionCanvas'), (regionCanvas, i) => { 
          //scale window to video 
          var w = Math.round(parseInt(regionCanvas.style.width) * stanW);
          var h = Math.round(parseInt(regionCanvas.style.height) * stanH);
          var y = Math.round(parseInt(regionCanvas.style.top) * stanH);
          var x = Math.round(parseInt(regionCanvas.style.left) * stanW);

          //get regionId
          var originalRegion = $.grep(videotagging.frames[videotagging.getCurrentFrame()], function(e){ return e.name == regionCanvas.id;})[0];

          //init and push the region tracker
          superTracking({x,y,w,h})
          .then( (suggestion) => {
              suggestionStack.push({sugRegion: suggestion, originalRegion : originalRegion});
              if (i == regionCount-1){
                d.resolve();
              } 
          })
          .catch(() => {});// reject means no object found
        });
      }
    });

    $('#video-tagging').on("stepFwdClicked-AfterStep", () => {
      $.when( d ).done( () => {
        //videotagging.video.addEventListener("canplaythrough", afterStep);
        afterStep();
        d = $.Deferred();
      });
    });  

    $('#video-tagging').on("canvasRegionDeleted", (e,deletedRegion) => {
       updateBlackList([deletedRegion]);
    });  

    $('#video-tagging').on("clearingAllRegions", () => {
       updateBlackList(videotagging.frames[videotagging.getCurrentFrame()]);
    });

    function afterStep() {
      videotagging.video.removeEventListener("canplaythrough", afterStep);
      function suggestionExists(e) {
        if (!e.suggestedBy) return undefined;
        return e.suggestedBy.regionId == suggestion.originalRegion.id; 
      }

      
      while(suggestionStack.length) {
         var currentFrameId = videotagging.getCurrentFrame();
         //create standardization vars
         var stanW = videotagging.video.offsetWidth/videotagging.video.videoWidth; 
         var stanH = videotagging.video.offsetHeight/videotagging.video.videoHeight;
         //suggestion
         var suggestion = suggestionStack.pop();
         var x1, y1, x2, y2;
         // if copy
         if (suggestion.sugRegion.type == "copy") {
           x1 = suggestion.sugRegion.region.x * stanW;
           y1 = suggestion.sugRegion.region.y * stanH;
           x2 = x1 + suggestion.sugRegion.region.w * stanW;
           y2 = y1 + suggestion.sugRegion.region.h * stanH;
         } else { //get bounding box of tracked object
            x1 = Math.max(Math.round(suggestion.sugRegion.x * stanW) - Math.round((suggestion.sugRegion.w * stanW)/2), 0),
            y1 = Math.max(Math.round(suggestion.sugRegion.y * stanH) - Math.round((suggestion.sugRegion.h * stanH)/2), 0),
            x2 = Math.min(Math.round(suggestion.sugRegion.w * stanW) + x1, videotagging.video.offsetWidth),
            y2 = Math.min(Math.round(suggestion.sugRegion.h * stanH) + y1, videotagging.video.offsetHeight);
         }

         // don't create a new region if a suggestion already exists
         if (currentFrameId in videotagging.frames){
           var existingSuggestion = $.grep(videotagging.frames[currentFrameId], suggestionExists); 
           if (existingSuggestion && existingSuggestion.length > 0) continue;
         }
         //don't create a region if its in the trackingSuggestionsBlacklist
         if (currentFrameId in trackingSuggestionsBlacklist) {
           if (trackingSuggestionsBlacklist[currentFrameId].has(suggestion.originalRegion.id)) continue;
         }
         //create new region
         videotagging.createRegion(x1, y1, x2, y2);
         videotagging.frames[currentFrameId][videotagging.frames[currentFrameId].length-1].tags = suggestion.originalRegion.tags;
         videotagging.frames[currentFrameId][videotagging.frames[currentFrameId].length-1].suggestedBy = {frameId:currentFrameId-1, regionId:suggestion.originalRegion.id};        

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

   
}

//testWriteToCanvas
function superTracking(region) {
    return new Promise((resolve, reject) => {
      const supertrackingFrameRate = 5;
      var video = document.createElement('video');
      video.src = videotagging.video.src;
      video.currentTime = videotagging.video.currentTime;
      video.load();

      var cstracker = new regiontrackr.camshift.Tracker({whitebalancing : false, calcAngles : false});
      
      var frameCanvas,
       canvasContext,
       trackedObject,
       tx, ty;

      video.addEventListener("canplaythrough", init);

      function init() {
        video.removeEventListener("canplaythrough", init);
        frameCanvas = document.createElement("canvas");
        frameCanvas.width = video.videoWidth;
        frameCanvas.height = video.videoHeight;
        canvasContext = frameCanvas.getContext("2d")
        canvasContext.drawImage(video, 0, 0);

        var tagging_duration = Math.min(video.currentTime + (1/videotagging.framerate), video.duration);

        //detect if scene change
        var scd = new SceneChangeDetector({ threshold:49, detectionRegion: { w:frameCanvas.width, h:frameCanvas.height } });

        $.when( scd.detectSceneChange(video, frameCanvas, canvasContext, videotagging.framerate) ).done( (sceneChanged) => {          
            if (!sceneChanged){
              //check if region sceneChanged
              rcd = new SceneChangeDetector({ threshold:1, detectionRegion: { w:region.w, h:region.h} });
              $.when( rcd.detectRegionChange(video, frameCanvas, canvasContext, region ,videotagging.framerate) ).done( (regionChanged) => {
                if (regionChanged) {
                  //init tracking
                  cstracker.initTracker(frameCanvas, new regiontrackr.camshift.Rectangle(region.x, region.y, region.w, region.h));
                  if (video.currentTime < tagging_duration) video.currentTime += (1/supertrackingFrameRate);
                  video.addEventListener("canplaythrough", trackFrames);
                } else{
                  resolve({type:"copy",region : region});//find better way to do this so that the schema is consistent
                }
              });
            }
        });

        function trackFrames (){
          //check exit condition 
          if (video.currentTime > tagging_duration) {
            video.removeEventListener("canplaythrough",trackFrames);
            if (trackedObject){
              resolve( {x : trackedObject.x, y : trackedObject.y, w : region.w, h: region.h});
            } else {
              reject("region not found");
            }
          }

          //track image 
          canvasContext.drawImage(video, 0, 0);
          cstracker.track(frameCanvas);
          trackedObject = cstracker.getTrackObj();  
          if (trackedObject.width === 0 || trackedObject.height === 0 ){
            video.removeEventListener("canplaythrough",trackFrames);
            reject("region not found");
          }

          //create new tracker 
          tx = Math.round(trackedObject.x - region.w/2);
          ty = Math.round(trackedObject.y - region.h/2);
           
          cstracker.initTracker(frameCanvas, new regiontrackr.camshift.Rectangle(tx, ty, region.w, region.h));
          
          //go to next frame segment
          video.currentTime += (1 / supertrackingFrameRate);
        }
      }
  });

}

//write image to camshift debug

function debugCamshift(cstracker,name){
  var bpi = cstracker.getBackProjectionImg();

    // create off-screen canvas element
   var canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');

    canvas.width = bpi.width;
    canvas.height = bpi.height;

  // create imageData object
  var idata = ctx.createImageData(bpi.width, bpi.height);

  // set our buffer as source
  idata.data.set(bpi.data);

  // update canvas with new data
  ctx.putImageData(idata, 0, 0);

  var dataUri = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, ""); // strip off the data: url prefix to get just the base64-encoded bytes http://stackoverflow.com/questions/5867534/how-to-save-canvas-data-to-file
    var buf = new Buffer(dataUri, 'base64');

    // strip off the data: url prefix to get just the base64-encoded bytes
    //var  = img.replace(/^data:image\/\w+;base64,/, "");
    //var buf = new Buffer(, 'base64');
    var debugPath = `${basepath}/camshift_debug/${pathJS.basename(videotagging.src, pathJS.extname(videotagging.src))}`;
    if (!fs.existsSync(`${basepath}/camshift_debug/`)) fs.mkdirSync(`${basepath}/camshift_debug/`);
    if (!fs.existsSync(debugPath)) fs.mkdirSync(debugPath);

    fs.writeFile(`${debugPath}/${name}.png`, buf);
}

