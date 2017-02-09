const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let ipcMain = require('electron').ipcMain;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minHeight: 480,
      minWidth: 480,
      icon: __dirname + '/icon.png',
      show: false
    });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  ipcMain.on('setFilePath', function (event, arg) {
    mainWindow.setRepresentedFilename(arg);

    // opened a file, enabling save and export to CNTK menu items
    let p = (process.platform === 'darwin') ? 1 : 0;
    menu.items[p].submenu.items[1].enabled = true;
    menu.items[p].submenu.items[3].enabled = true;
  });

  mainWindow.on('ready-to-show', function() {
      mainWindow.show();
      mainWindow.focus();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

  const {app, Menu} = require('electron');
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click () { mainWindow.webContents.send('openVideo'); }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          enabled: false,
          click () { mainWindow.webContents.send('saveVideo'); }
        },
        {
          type: 'separator'
        },
        {
          label: 'Export to CNTK',
          accelerator: 'CmdOrCtrl+E',
          enabled: false,
          click () { mainWindow.webContents.send('exportCNTK'); }
        }
      ]
    },
    {
      label: 'Debug',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+T',
          click () { mainWindow.webContents.toggleDevTools(); }
        }
      ]
    }
  ]

if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    })
    template[1].submenu.push();
    template[2].submenu.push();
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.