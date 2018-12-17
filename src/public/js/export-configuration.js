const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

window.onload = function(){
    document.getElementById('exportButton').onclick = getExportConfiguration;
    document.getElementById('cancelButton').onclick = closeWindow;
}

ipcRenderer.on('configs', (event, configs) => {  
    $('#output').val(configs.assetFolder);
    $('#format').empty(); // remove old options
    configs.supportedFormats.forEach( (algorithm) => {
        $('#format').append($("<option></option>").attr("value", algorithm).text(algorithm));
    });
});


function getExportConfiguration() {
    var exportConfig = {
        exportUntil: $('#exportTo').val(),
        exportPath: $('#output').val(),
        exportFormat: $('#format').val()
    };
    ipcRenderer.send('export-tags', exportConfig);
    closeWindow();
}


function closeWindow() {
     remote.getCurrentWindow().hide();
}

function getOutputFolder(){
    remote.dialog.showOpenDialog({
      filters: [{ name: 'Output Folder'}],
      properties: ['openDirectory']
    }, (pathName) => {
        $('#output').val(pathName);
    });
}