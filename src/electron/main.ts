import {
    app, ipcMain, BrowserWindow, BrowserWindowConstructorOptions,
    Menu, MenuItemConstructorOptions, MenuItem,
} from "electron";
import { IpcMainProxy } from "./common/ipcMainProxy";
import LocalFileSystem from "./providers/storage/localFileSystem";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow;
let ipcMainProxy: IpcMainProxy;

function createWindow() {
    const windowOptions: BrowserWindowConstructorOptions = {
        width: 1024,
        height: 768,
        frame: process.platform === "linux",
        titleBarStyle: "hidden",
        backgroundColor: "#272B30",
        show: false,
        // Node Integration is now disabled by default
        // https://github.com/electron/electron/pull/16235
        webPreferences: {
            nodeIntegration: true,
        },
    };

    const staticUrl = process.env.ELECTRON_START_URL || `file:///${__dirname}/index.html`;
    if (process.env.ELECTRON_START_URL) {
        windowOptions.webPreferences.webSecurity = false;
    }

    mainWindow = new BrowserWindow(windowOptions);
    mainWindow.loadURL(staticUrl);
    mainWindow.maximize();

    // Emitted when the window is closed.
    mainWindow.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    // Provides a more graceful experience and eliminates the white screen on load
    // This event fires after the app first render
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    registerContextMenu(mainWindow);

    ipcMainProxy = new IpcMainProxy(ipcMain, mainWindow);
    ipcMainProxy.register("RELOAD_APP", onReloadApp);
    ipcMainProxy.register("TOGGLE_DEV_TOOLS", onToggleDevTools);

    const localFileSystem = new LocalFileSystem(mainWindow);
    ipcMainProxy.registerProxy("LocalFileSystem", localFileSystem);
}

function onReloadApp() {
    mainWindow.reload();
    return true;
}

function onToggleDevTools() {
    mainWindow.webContents.toggleDevTools();
}

/**
 * Adds standard cut/copy/paste/etc context menu comments when right clicking input elements
 * @param browserWindow The browser window to apply the context-menu items
 */
function registerContextMenu(browserWindow: BrowserWindow): void {
    const selectionMenu = Menu.buildFromTemplate([
        new MenuItem({ role: "copy", accelerator: "CmdOrCtrl+C" }),
        new MenuItem({ role: "copy", accelerator: "CmdOrCtrl+C" }),
        new MenuItem({ type: "separator" }),
        new MenuItem({ role: "selectAll", accelerator: "CmdOrCtrl+A" }),
    ]);

    const inputMenu = Menu.buildFromTemplate([
        new MenuItem({ role: "undo", accelerator: "CmdOrCtrl+Z" }),
        new MenuItem({ role: "redo", accelerator: "CmdOrCtrl+Shift+Z" }),
        new MenuItem({ type: "separator" }),
        new MenuItem({ role: "cut", accelerator: "CmdOrCtrl+X" }),
        new MenuItem({ role: "copy", accelerator: "CmdOrCtrl+C" }),
        new MenuItem({ role: "paste", accelerator: "CmdOrCtrl+V" }),
        new MenuItem({ type: "separator" }),
        new MenuItem({ role: "selectAll", accelerator: "CmdOrCtrl+A" }),
    ]);

    browserWindow.webContents.on("context-menu", (e, props) => {
        const { selectionText, isEditable } = props;
        if (isEditable) {
            inputMenu.popup({
                window: browserWindow,
            });
        } else if (selectionText && selectionText.trim() !== "") {
            selectionMenu.popup({
                window: browserWindow,
            });
        }
    });

    const menuItems: MenuItemConstructorOptions[] = [
        {
            label: "File", submenu: [
                { role: "quit" },
            ],
        },
        { role: "editMenu" },
        {
            label: "View", submenu: Menu.buildFromTemplate([
                new MenuItem({ role: "reload" }),
                new MenuItem({ type: "separator" }),
                new MenuItem({ role: "toggleDevTools" }),
                new MenuItem({ role: "togglefullscreen" }),
                new MenuItem({ type: "separator" }),
                new MenuItem({ role: "resetZoom" }),
                new MenuItem({ role: "zoomIn" }),
                new MenuItem({ role: "zoomOut" }),
            ]),
        },
        { role: "windowMenu" },
    ];
    const menu = Menu.buildFromTemplate(menuItems);
    Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
