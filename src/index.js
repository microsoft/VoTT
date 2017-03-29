const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const pathJS = require('path');
const fs = require('fs');
const DetectionExtension = require('./lib/videotagging_extensions').Detection;
const ipcRenderer = require('electron').ipcRenderer;
const testSetSize = .20;
var trackingEnabled = true;
var visitedFrames, //keep track of the visited frames
    videotagging,
    detection,
    trackingExtension; 

$(document).ready(() => {//init confirm keys figure out why this doesn't work
  $('#inputtags').tagsinput({confirmKeys: [13, 32, 44, 45, 46, 59, 188]});
});

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

ipcRenderer.on('export', (event, message) => {
   var args = {
     type : "export",
     supportedFormats : detection.detectionAlgorithmManager.getAvailbleAlgorthims()
   };

   ipcRenderer.send('show-popup', args);
});

ipcRenderer.on('export-tags', (event, exportConfig) => {
  addLoader();
  detection.export(exportConfig.exportFormat, exportConfig.exportUntil, exportConfig.exportPath, testSetSize, () => {
     videotagging.video.oncanplay = updateVisitedFrames;
     $(".loader").remove();
  });
});

ipcRenderer.on('review', (event, message) => {
     var args = {
        type: 'review',
        supportedFormats : detection.detectionAlgorithmManager.getAvailbleAlgorthims()
     };
     ipcRenderer.send('show-popup', args);
});

ipcRenderer.on('review-model', (event, reviewModelConfig) => {
  //add logic for supporting alternate review model methods besides cntk

  var modelLocation = reviewModelConfig.modelPath;
  
  if (fs.existsSync(modelLocation)) {
    addLoader();
    detection.review( reviewModelConfig.modelFormat, modelLocation, reviewModelConfig.output, () => {
        $(".loader").remove();
        videotagging.video.oncanplay = updateVisitedFrames;
    });
  } else {
      alert(`No model found! Please make sure you put your model in the following directory: ${modelLocation}`)
  }
      
});

ipcRenderer.on('toggleTracking', (event, message) => {
  if (trackingEnabled) {
    trackingExtension.stopTracking();
  } else {
    trackingExtension.startTracking();
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
    $('#video-tagging-container').hide();
    $('#load-form-container').show();
    $('#framerateGroup').show();
    
    //set title indicator
    $('title').text(`Video Tagging Job Configuration: ${pathJS.basename(pathName, pathJS.extname(pathName))}`);
    $('#inputtags').tagsinput('removeAll');//remove all previous tag labels
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

    document.getElementById('loadButton').onclick = loadTagger;
    
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
        videotagging.video.oncanplay = updateVisitedFrames; //remove old listener

        //init region tracking
        trackingExtension = new VideoTaggingTrackingExtension({
            videotagging: videotagging, 
            trackingFrameRate: 10,
            saveHandler: save
        });
        trackingExtension.startTracking();

        //init detection
        detection = new DetectionExtension(videotagging, visitedFrames);
        
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
      "visitedFrames": Array.from(visitedFrames),
    };
    
    fs.writeFileSync(`${videotagging.src}.json`, JSON.stringify(saveObject));
}
