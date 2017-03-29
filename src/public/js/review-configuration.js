const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const basepath = remote.app.getAppPath();

window.onload = function(){
    document.getElementById('reviewButton').onclick = getReviewConfiguration;
    document.getElementById('cancelButton').onclick = closeWindow;
    $('#output').val(`${basepath}/review`);
}

ipcRenderer.on('supported-formats', (event, supportedFormats) => {  
    $('#format').empty(); // remove old options
    console.log(supportedFormats);
    $.each(supportedFormats, function(key, value) {
        $('#format').append($("<option></option>").attr("value", value).text(key));
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