const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const dialog = remote.require('electron').dialog;
const path = require('path');
const fs = require('fs');
const DetectionExtension = require('./lib/videotagging_extensions').Detection;
const ipcRenderer = require('electron').ipcRenderer;
const testSetSize = .20;
var trackingEnabled = true;
var saveState,
    visitedFrames, //keep track of the visited frames
    videotagging,
    detection,
    trackingExtension,
    assetFolder; 

$(document).ready(() => {//init confirm keys figure out why this doesn't work
  $('#inputtags').tagsinput({confirmKeys: [13, 32, 44, 45, 46, 59, 188]});
});

//ipc rendering
ipcRenderer.on('openVideo', (event, message) => {
  fileSelected();
});

ipcRenderer.on('openImageDirectory', (event, message) => {
  folderSelected();
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
     supportedFormats : detection.detectionAlgorithmManager.getAvailbleExporters(),
     assetFolder : assetFolder
   };

   ipcRenderer.send('show-popup', args);
});

ipcRenderer.on('export-tags', (event, exportConfig) => {
  addLoader();
  detection.export(videotagging.imagelist, exportConfig.exportFormat, exportConfig.exportUntil, exportConfig.exportPath, testSetSize, () => {
     if(!videotagging.imagelist){
       videotagging.video.oncanplay = updateVisitedFrames;
      } 
     $(".loader").remove();
  });
});

ipcRenderer.on('review', (event, message) => {
    var args = {
      type: 'review',
      supportedFormats : detection.detectionAlgorithmManager.getAvailbleReviewers(),
      assetFolder : assetFolder
    };
    ipcRenderer.send('show-popup', args);
});

ipcRenderer.on('reviewEndpoint', (event, message) => {
  var args = {
    type: 'review-endpoint',
  };
  ipcRenderer.send('show-popup', args);
});

ipcRenderer.on('review-model', (event, reviewModelConfig) => {
  var modelLocation = reviewModelConfig.modelPath;
  if (fs.existsSync(modelLocation)) {
    addLoader();
    var colors_back = videotagging.optionalTags.colors;
    videotagging.optionalTags.colors = null;

    detection.review(videotagging.imagelist, reviewModelConfig.modelFormat, modelLocation, reviewModelConfig.output, (err) => {
        if (err){
          alert(`An error occured with Local Active Learning \n Please check the debug console for more information.`);
          videotagging.optionalTags.colors = colors_back;
        }
        if(!videotagging.imagelist){
          videotagging.video.oncanplay = updateVisitedFrames;
        }      
        $(".loader").remove();        
    });
  }
   else {
      alert(`No model found! Please make sure you put your model in the following directory: ${modelLocation}`)
  }
      
});

ipcRenderer.on('review-model-endpoint', (event, reviewModelConfig) => {
    addLoader();
    detection.reviewEndpoint( videotagging.imagelist, reviewModelConfig.endpoint, (err) => {
      if (err){
        alert(`An error occured with Remote Active Learning \n Please check the debug console for more information.`);
      }
      if(!videotagging.imagelist){
        videotagging.video.oncanplay = updateVisitedFrames;
      }      
      $(".loader").remove();        
    });    
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
    $("#vidImage").attr('src', './public/images/Load-Video.png');
    return false;
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0].type == "video/mp4") {
      e.dataTransfer.dropEffect = "copy";
      $("#vidImage").attr('src', './public/images/Load-Video-Active.png');

    }
    e.stopPropagation();
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    $("#vidImage").attr('src', './public/images/Load-Video.png');
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
function fileSelected(filepath) {
   $('#load-message-container').hide();

  if (filepath) {  //checking if a video is dropped
    let pathName = filepath.path;
    openPath(pathName, false);
  } else { // showing system open dialog
    dialog.showOpenDialog({
      filters: [{ name: 'Videos', extensions: ['mp4','ogg']}],
      properties: ['openFile']
    },
    function (pathName) {
      if (pathName) openPath(pathName[0], false);
      else $('#load-message-container').show();
    });
  }

}

function folderSelected(folderpath) {
   $('#load-message-container').hide();
   dialog.showOpenDialog({
      filters: [{ name: 'Image Directory'}],
      properties: ['openDirectory']
    },function (pathName) {
      if (pathName) openPath(pathName[0], true);
      else $('#load-message-container').show();
    });

}

function openPath(pathName, isDir) {
    // show configuration
    $('#load-message-container').hide();
    $('#video-tagging-container').hide();
    $('#load-form-container').show();
    $('#framerateGroup').show();
    
    //set title indicator
    $('title').text(`Tagging Job Configuration: ${path.basename(pathName, path.extname(pathName))}`);
    $('#inputtags').tagsinput('removeAll');//remove all previous tag labels

    if (isDir) {
      $('#framerateGroup').hide();
      $('#suggestGroup').hide();
    } else {
      $('#framerateGroup').show();
      $('#suggestGroup').show();
    }

    assetFolder = path.join(path.dirname(pathName), `${path.basename(pathName, path.extname(pathName))}_output`);
    
    try {
      var config = require(`${pathName}.json`);
      saveState = JSON.stringify(config);
      //restore config
      $('#inputtags').val(config.inputTags);
      config.inputTags.split(",").forEach( tag => {
          $("#inputtags").tagsinput('add',tag);
      });
      if (config.framerate){
         $("#framerate").val(config.framerate);
      }
      if (config.suggestiontype){
        $('#suggestiontype').val(config.suggestiontype);
      }
      if (config.scd){
        document.getElementById("scd").checked = config.scd;
      }
      
    } catch (e) {
      console.log(`Error loading save file ${e.message}`);
    }

    document.getElementById('loadButton').onclick = loadTagger;
    
    function loadTagger (e) {
      if(framerate.validity.valid && inputtags.validity.valid) {
        $('.bootstrap-tagsinput').last().removeClass( "invalid" );
             
        videotagging = document.getElementById('video-tagging'); //find out why jquery doesn't play nice with polymer
        videotagging.regiontype = $('#regiontype').val();
        videotagging.multiregions = 1;
        videotagging.regionsize = $('#regionsize').val();
        videotagging.inputtagsarray = $('#inputtags').val().replace(/\s/g,'').split(',');
        videotagging.video.currentTime = 0;
        videotagging.framerate = $('#framerate').val();
        videotagging.src = ''; // ensures reload if user opens same video 

        if (config) {  
          if (config.tag_colors){
            videotagging.optionalTags.colors = config.tag_colors;
          }
            videotagging.inputframes = config.frames;
          visitedFrames = new Set(config.visitedFrames);
        } else {
          videotagging.inputframes = {};
           visitedFrames =  (isDir) ? new Set([0]) : new Set();
        } 

        if (isDir){
            $('title').text(`Image Tagging Job: ${path.dirname(pathName)}`); //set title indicator

            //get list of images in directory
            var files = fs.readdirSync(pathName);
            
            videotagging.imagelist = files.filter(function(file){
                  return file.match(/.(jpg|jpeg|png|gif)$/i);
            });

            if (videotagging.imagelist.length){
              videotagging.imagelist = videotagging.imagelist.map((filepath) => {return path.join(pathName,filepath)});
              if (config && config.framesByImagesName){
                var frames = {};
                for (var k in config.framesByImagesName){
                  if (config.framesByImagesName.hasOwnProperty(k)) {
                    var fullFilepath = path.join(pathName, k);
                    var imgIndex = videotagging.imagelist.indexOf(fullFilepath);
                    if (imgIndex > -1){
                      frames[imgIndex] = config.framesByImagesName[k];
                    }
                  }
                }
                if (Object.keys(frames).length > 0){
                  videotagging.inputframes = frames;
                }
              }
              videotagging.src = pathName; 
              //track visited frames
              $("#video-tagging").off("stepFwdClicked-AfterStep", updateVisitedFrames);
              $("#video-tagging").on("stepFwdClicked-AfterStep", updateVisitedFrames);
              $("#video-tagging").on("stepFwdClicked-AfterStep", () => {
                  //update title to match src
                   $('title').text(`Image Tagging Job: ${path.basename(videotagging.curImg.src)}`);

              });
              $("#video-tagging").on("stepBwdClicked-AfterStep", () => {
                //update title to match src
                 $('title').text(`Image Tagging Job: ${path.basename(videotagging.curImg.src)}`);

            });


              //auto-save 
              $("#video-tagging").off("stepFwdClicked-BeforeStep");
              $("#video-tagging").on("stepFwdClicked-BeforeStep", save);
              
            } else {
              alert("No images were in the selected directory. Please choose an Image directory.");
                return folderSelected();
            }
        } else {
          $('title').text(`Video Tagging Job: ${path.basename(pathName, path.extname(pathName))}`); //set title indicator
          videotagging.disableImageDir();
          videotagging.src = pathName;
          //set start time
          videotagging.video.oncanplay = function (){
              videotagging.videoStartTime = videotagging.video.currentTime;
              videotagging.video.oncanplay = undefined;
          }
          //init region tracking
          trackingExtension = new VideoTaggingTrackingExtension({
              videotagging: videotagging, 
              trackingFrameRate: 15,
              method: $('#suggestiontype').val(),
              enableRegionChangeDetection: document.getElementById("scd").checked,
              enableSceneChangeDetection: document.getElementById("scd").checked,
              saveHandler: save
          });
          videotagging.video.oncanplay = updateVisitedFrames; 
          //track visited frames
          trackingExtension.startTracking();
        }

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

//saves current video to config 
function save() {
    var saveObject = {
      "frames" : videotagging.frames,
      "framerate":$('#framerate').val(),
      "inputTags": $('#inputtags').val().replace(/\s/g,''),
      "suggestiontype": $('#suggestiontype').val(),
      "scd": document.getElementById("scd").checked,
      "visitedFrames": Array.from(visitedFrames),
      "tag_colors" : videotagging.optionalTags.colors,
    };
    //for image directory
    if (videotagging.imagelist){
      var imgFramesByName = {};
      Object.keys(videotagging.frames).forEach( i => {
        if (!isNaN(Number(i))){
          var imgFilename = path.basename(videotagging.imagelist[Number(i)]);
          imgFramesByName[imgFilename] = videotagging.frames[i];
        }
      });
      saveObject.framesByImagesName = imgFramesByName;
    }
    //if nothing changed don't save
    if (saveState === JSON.stringify(saveObject) ) {
      return;
    }

    var saveLock;
    if (!saveLock){
           saveLock = true;
           fs.writeFile(`${videotagging.src}.json`, JSON.stringify(saveObject),()=>{
             saveState = JSON.stringify(saveObject);
             console.log("saved");
           });
           setTimeout(()=>{saveLock=false;}, 500);
    } 

}
