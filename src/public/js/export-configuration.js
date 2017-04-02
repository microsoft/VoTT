const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const basepath = remote.app.getAppPath();
const path = require('path');

window.onload = function(){
    document.getElementById('exportButton').onclick = getExportConfiguration;
    document.getElementById('cancelButton').onclick = closeWindow;
    $('#output').val(path.join(basepath,'output'));
}

ipcRenderer.on('supported-formats', (event, supportedFormats) => {  
    $('#format').empty(); // remove old options
    supportedFormats.forEach( (algorithm) => {
        $('#format').append($("<option></option>").attr("value", algorithm).text(algorithm));
    });
});


function getExportConfiguration() {
    var exportConfig = {
        exportUntil:   $('#exportTo').val(),
        exportPath: $('#output').val(),
        exportFormat: $('#format').val()
    };

    ipcRenderer.send('export-tags', exportConfig); 
    closeWindow();
}


function closeWindow() {
     remote.getCurrentWindow().hide();
}