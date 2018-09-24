const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
 window.onload = function(){
    document.getElementById('cancelButton').onclick = closeWindow;
    window.addEventListener('keyup', (e) => {
        if(e.code == 'Escape'){
          closeWindow();
        }
      });
}
 function closeWindow() {
     remote.getCurrentWindow().hide();
}