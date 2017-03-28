const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const basepath = remote.app.getAppPath();


window.onload = function(){
    document.getElementById('exportButton').onclick = getExportConfiguration;
    document.getElementById('cancelButton').onclick = closeWindow;
    $('#output').val(`${basepath}/output`);
}

ipcRenderer.on('supported-formats', (event, supportedFormats) => {  
    $('#format').empty(); // remove old options
    console.log(supportedFormats);
    $.each(supportedFormats, function(key, value) {
        $('#format').append($("<option></option>").attr("value", value).text(key));
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