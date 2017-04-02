const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const path = require('path');


window.onload = function(){
    document.getElementById('reviewButton').onclick = getReviewConfiguration;
    document.getElementById('cancelButton').onclick = closeWindow;
    $('#output').val(path.join(basepath,'review'));
}

ipcRenderer.on('supported-formats', (event, supportedFormats) => {  
    $('#format').empty(); // remove old options
    supportedFormats.forEach( (algorithm) => {
        $('#format').append($("<option></option>").attr("value", algorithm).text(algorithm));
    });
});

function getReviewConfiguration() {
    var reviewModelConfig = {
        modelPath:  $('#model').val(),
        output: $('#output').val(),
        modelFormat: $('#format').val()
    };
    ipcRenderer.send('review-model', reviewModelConfig); 
    closeWindow();
}

function closeWindow() {
     remote.getCurrentWindow().hide();
}