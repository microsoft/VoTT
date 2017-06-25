const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

window.onload = function(){
    document.getElementById('reviewButton').onclick = getReviewConfiguration;
    document.getElementById('cancelButton').onclick = closeWindow;
}

ipcRenderer.on('configs', (event, configs) => {  
    $('#output').val(configs.assetFolder+"_review");
    $('#format').empty(); // remove old options
    configs.supportedFormats.forEach( (algorithm) => {
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

function getModelFile(){
    remote.dialog.showOpenDialog({
      filters: [{ name: 'Model File', extensions: ['model']}],
      properties: ['openFile']
    }, (pathName) => {
        $('#model').val(pathName);
    });
}