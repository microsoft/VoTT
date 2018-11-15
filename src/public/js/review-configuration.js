const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

window.onload = function(){
    document.getElementById('reviewButton').onclick = getReviewConfiguration;
    document.getElementById('cancelButton').onclick = closeWindow;
}

ipcRenderer.on('configs', (event, configs) => {  
    $('#output').val(configs.assetFolder+"_review");
    $('#format').empty(); // remove old options
    $('#remote-group').hide();
    configs.supportedFormats.forEach( (algorithm) => {
        $('#format').append($("<option></option>").attr("value", algorithm).text(algorithm));
    });
    $('#format').append($("<option></option>").attr("value", "remote").text("Remote Endpoint"));
    
    $("#format").change(()=> {
        if  ($('#format').val() == "remote"){
            $('#remote-group').show();
            $('#output-group').hide();
            $('#model-group').hide();
        } else{
            $('#remote-group').hide();
            $('#output-group').show();
            $('#model-group').show();
        }
    });

});

function getReviewConfiguration(){

    if  ($('#format').val() == "remote") {
        var reviewModelConfig = {
            endpoint:  $('#endpoint').val(),
        };
        ipcRenderer.send('review-model-endpoint', reviewModelConfig); 
    } else {
        var reviewModelConfig = {
            modelPath:  $('#model').val(),
            output: $('#output').val(),
            modelFormat: $('#format').val()
        };
        ipcRenderer.send('review-model', reviewModelConfig);
    }
    
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

function getOutputFolder(){
    remote.dialog.showOpenDialog({
      filters: [{ name: 'Output Folder'}],
      properties: ['openDirectory']
    }, (pathName) => {
        $('#output').val(pathName);
    });
}