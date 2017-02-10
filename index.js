const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const path = require('path');
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

function fileSelected(filePath) {
  document.getElementById('openFile').style.display = "none";

  if(filePath) {  //checking if a video is dropped
    let fileName = [filePath.path];
    openFile(fileName);
  } else { // showing system open dialog
    dialog.showOpenDialog({
      filters: [{ name: 'Videos', extensions: ['mp4']}],
      properties: ['openFile']
    },
    function (fileName) {
      openFile(fileName);
    });
  }

  function openFile(fileName) {
    if (fileName) {
        var config;

        document.getElementById('video-tagging-container').style.display = "none";
        document.getElementById('exportCNTK').style.display = "none";
        document.getElementById('saveFile').style.display = "none";
        document.getElementById('load-message').style.display = "none";
        document.getElementById('load-form-container').style.display = "block";

        $('title').text(`Video Tagging Job Configuration: ${path.basename(fileName[0], path.extname(fileName[0]))}`);      //set title indicator
        $('#inputtags').tagsinput('removeAll');//remove all previous tag labels

        try{
          config = require(`${fileName}.json`);
          document.getElementById('MultiRegions').checked = config.multiRegions;
          //restore tags
          document.getElementById('inputtags').value = config.inputTags;
          config.inputTags.split(",").forEach(function(tag) {
              $("#inputtags").tagsinput('add',tag);
          });
        }
        catch (e){
          console.log(`Error loading save file ${e.message}`);
        }
        document.getElementById('loadButton').addEventListener('click', function (e) {

          videotagging = document.getElementById('video-tagging');
          videotagging.framerate = document.getElementById('framerate').value;
          videotagging.regiontype = document.getElementById('regiontype').value;
          videotagging.multiregions = document.getElementById('MultiRegions').checked ? "1":"0";
          videotagging.regionsize = document.getElementById('regionsize').value;
          videotagging.inputtagsarray = document.getElementById('inputtags').value.split(',');

          videotagging.video.currentTime = 0;

          if(config) videotagging.inputframes = config.frames;
          else videotagging.inputframes = {};

          document.getElementById('load-form-container').style.display = "none";
          document.getElementById('video-tagging-container').style.display = "block";
          document.getElementById('openFile').style.display = "inline";
          document.getElementById('saveFile').style.display = "inline";
          document.getElementById('exportCNTK').style.display = "inline";

          videotagging.src = fileName;//load

          console.log(fileName);

          ipcRenderer.send('setFilePath', fileName[0])

          //set title indicator
          $('title').text(`Video Tagging Job: ${path.basename(fileName[0], path.extname(fileName[0]))}`);

          //track furthestVisitedFrame
          furthestVisitedFrame = 1;
          videotagging.video.removeEventListener("canplaythrough", updateFurthestVisitedFrame); //remove old listener
          videotagging.video.addEventListener("canplaythrough",updateFurthestVisitedFrame);

          //init region tracking
          videotagging.video.addEventListener("canplaythrough", initSelectedRegionTracking);

        });
    }
    else {
      document.getElementById('openFile').style.display = "inline";
    }
  }

}

function save() {
    var saveObject = {
      "frames" : videotagging.frames,
      "inputTags": document.getElementById('inputtags').value,
      "multiRegions": document.getElementById('MultiRegions').checked
    }

    console.log(frames);
    fs.writeFileSync(`${videotagging.src}.json`, JSON.stringify(saveObject));

    let notification = new Notification('Offline Video Tagger', {
      body: 'Successfully saved metadata in ' + `${videotagging.src}.json`
    });
}

function exportCNTK() {

  $("<div class=\"loader\"></div>").appendTo($("#videoWrapper"));

  //make sure paths exist
  if (!fs.existsSync(`${basepath}/cntk`)) fs.mkdirSync(`${basepath}/cntk`);
  var framesPath = `${basepath}/cntk/${path.basename(videotagging.src[0], path.extname(videotagging.src[0]))}_frames`;

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
    var writePath = `${framesPath}/negative/${path.basename(videotagging.src[0], path.extname(videotagging.src[0]))}_frame_${frameId}.jpg`; //defaults to negative
    var positiveWritePath = `${framesPath}/positive/${path.basename(videotagging.src[0], path.extname(videotagging.src[0]))}_frame_${frameId}.jpg`;
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

//suggest frames based on current tags on next
function initSelectedRegionTracking() {

    videotagging.video.removeEventListener("canplaythrough", initSelectedRegionTracking); //remove old listener

    var frameCanvas = document.createElement("canvas");
    frameCanvas.width = videotagging.video.videoWidth;
    frameCanvas.height = videotagging.video.videoHeight;
    var canvasContext = frameCanvas.getContext("2d");

    var cstracker = new regiontrackr.camshift.Tracker({whitebalancing : false,calcAngles:false});
    var scd = new SceneChangeDetector(options={threshold:60, detectionRegion:{w:frameCanvas.width, h:frameCanvas.height}});

    var prevImage, prevFrameId, prevRegionId, prevLabels;

    $('#video-tagging').on("stepFwdClicked-BeforeStep",function(){
      
      //get selectedTag information later generalize this for all tags
      if ($('.regionCanvasSelected')[0]) {

        canvasContext.drawImage(videotagging.video, 0, 0);

        prevRegionId = $('.regionCanvasSelected')[0].id;
        var w = parseInt($('.regionCanvasSelected')[0].style.width);
        var h = parseInt($('.regionCanvasSelected')[0].style.height);
        var y = parseInt($('.regionCanvasSelected')[0].style.top);
        var x = parseInt($('.regionCanvasSelected')[0].style.left);
        var stanW = frameCanvas.width/videotagging.video.offsetWidth;
        var stanH = frameCanvas.height/videotagging.video.offsetHeight;

        //store selected frames tags
        prevFrameId = videotagging.getCurrentFrame()
        prevLabels = $.grep(videotagging.frames[prevFrameId], function(e){ return e.name == $('.regionCanvasSelected')[0].id;})[0].tags;
        
        //init camshift tracker
        cstracker.initTracker(frameCanvas, new regiontrackr.camshift.Rectangle(Math.floor(x * stanW),Math.floor(y * stanH),Math.floor(w*stanW),Math.floor(h*stanH)));
        
        //init store imagedata for scene detection
        prevImage = canvasContext.getImageData(0, 0, frameCanvas.width, frameCanvas.height).data;
      }

    });

    $('#video-tagging').on("stepFwdClicked-AfterStep",function(){
            if (prevImage) {
        
        //apply camshift here 
        cstracker.track(frameCanvas);
        var trackedObject = cstracker.getTrackObj();   
        
        //break if picture disapears or scene changes
        canvasContext.drawImage(videotagging.video, 0, 0);
        curImage = canvasContext.getImageData(0, 0, frameCanvas.width, frameCanvas.height).data;
        if ((scd.detectSceneChange(prevImage, curImage))||(trackedObject.width == 0 || trackedObject.height == 0 )){
            prevImage = undefined;
            return;
        }

        //convert canvas to video scale
        stanW = videotagging.video.offsetWidth / frameCanvas.width;
        stanH = videotagging.video.offsetHeight /frameCanvas.height;
        var tx1 = Math.max(Math.floor((trackedObject.x - trackedObject.width/2)  * stanW), 0);
        var ty1 = Math.max(Math.floor((trackedObject.y - trackedObject.height/2) * stanH), 0);
        var tx2 = Math.min(Math.floor((trackedObject.width * stanW + tx1)), videotagging.video.offsetWidth);
        var ty2 = Math.min(Math.floor((trackedObject.height * stanH + ty1)), videotagging.video.offsetHeight);

        // don't create a new region if a suggestion already exists
        var currentFrameId = videotagging.getCurrentFrame();
        if (videotagging.frames[currentFrameId]){
          var existingSuggestion = $.grep(videotagging.frames[currentFrameId], function(e) { 
            if (!e.suggestedBy) return undefined;
            return ((e.suggestedBy.frameId == prevFrameId) && (e.suggestedBy.regionId == prevRegionId)); 
          }); 
          if (existingSuggestion && existingSuggestion.length > 0) {
            prevImage = prevFrameId = prevRegionId = undefined;
            return;
          }
        }

        //create new region
        videotagging.createRegion( tx1,ty1,tx2,ty2);   
        videotagging.frames[currentFrameId][videotagging.frames[currentFrameId].length-1].tags = prevLabels;//set tags to original region tags debug this
        videotagging.frames[currentFrameId][videotagging.frames[currentFrameId].length-1].suggestedBy = {frameId:prevFrameId, regionId:prevRegionId};
        
        prevImage = prevFrameId = prevRegionId = undefined;
      }  

    });          

}




//For debuging canvas frames
function getDataUrlFromArr(arr, w, h) {
  if(typeof w === 'undefined' || typeof h === 'undefined') {
    w = h = Math.sqrt(arr.length / 4);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = w;
  canvas.height = h;

  const imgData = ctx.createImageData(w, h);
  imgData.data.set(arr);
  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL();
}

