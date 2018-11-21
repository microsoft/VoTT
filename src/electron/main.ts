import { app, BrowserWindow, dialog } from 'electron';
import path, { dirname } from 'path';
import url from 'url';
import { IpcMainProxy } from '../common/ipcMainProxy';
import fs from 'fs';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow;
let ipcMainProxy: IpcMainProxy;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 1024, height: 768 });

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });
    mainWindow.loadURL(startUrl);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });

    ipcMainProxy = new IpcMainProxy(mainWindow);
    ipcMainProxy.register('RELOAD_APP', onReloadApp);
    ipcMainProxy.register('TOGGLE_DEV_TOOLS', onToggleDevTools);
    ipcMainProxy.register('OPEN_LOCAL_FOLDER', onOpenLocalFolder);
    ipcMainProxy.register('WRITE_LOCAL_FILE', onWriteLocalFile);
    ipcMainProxy.register('DELETE_LOCAL_FILE', onDeleteLocalFile);
}

function onReloadApp() {
    mainWindow.reload();
    return true;
};

function onToggleDevTools(sender: any, show: boolean) {
    if (show) {
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.webContents.closeDevTools();
    }
};

function onOpenLocalFolder() {
    return new Promise<string[]>((resolve, reject) => {
        dialog.showOpenDialog(mainWindow, {
            title: 'Select Folder',
            buttonLabel: 'Choose Folder',
            properties: ['openDirectory', 'createDirectory']
        },
            (filePaths) => {
                resolve(filePaths)
            });
    });
}

function onWriteLocalFile(sender, args) {
    return new Promise<void>((resolve, reject) => {
        const dirName: fs.PathLike = path.dirname(args.path);
        const exists = fs.existsSync(dirName);
        if (!exists) {
            fs.mkdirSync(dirName);
        }

        fs.writeFile(args.path, args.contents, (err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        })
    });
}

function onDeleteLocalFile(sender, args) {
    return new Promise<void>((resolve, reject) => {
        const exists = fs.existsSync(args.path);
        if (exists) {
            fs.unlink(args.path, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        }
    })
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