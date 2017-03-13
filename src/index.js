const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const pathJS = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const cntkModel= require('cntk-fastrcnn');
const cntkPath = require(`${basepath}/cntk-config.json`).cntkPath;
const ipcRenderer = require('electron').ipcRenderer;
var trackingEnabled = true;
var visitedFrames, //keep track of the visited frames
    videotagging,
    CNTKExtension,
    trackingExtension; 

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
    if (fs.existsSync(cntkPath)) {
        var modelLocation = $('#model').val();
        if (fs.existsSync(modelLocation)) {
          addLoader();
          CNTKExtension.reviewCNTK(modelLocation, removeLoader);
        } else {
            alert(`No model found! Please make sure you put your model in the following directory: ${modelLocation}`)
        }
        
    } else {
      alert("This feature isn't supported by your system please check your CNTK configuration and try again later.");
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
            cntkpath: cntkPath,
            videotagging: videotagging,
            visitedFrames: visitedFrames,
            exportUntil: $('#exportTo').val(),
            exportPath: $('#output').val()
        });

        //init region tracking
        trackingExtension = new VideoTaggingTrackingExtension({
            videotagging: videotagging, 
            trackingFrameRate: 10,
            saveHandler: save
        });
        trackingExtension.startTracking();

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

