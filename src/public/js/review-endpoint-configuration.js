const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

window.onload = function(){
    document.getElementById('reviewButton').onclick = getReviewConfiguration;
    document.getElementById('cancelButton').onclick = closeWindow;
}

function getReviewConfiguration() {
    var reviewModelConfig = {
        endpoint:  $('#endpoint').val(),
    };
    ipcRenderer.send('review-model-endpoint', reviewModelConfig); 
    closeWindow();
}

function closeWindow() {
     remote.getCurrentWindow().hide();
}



