const tfrecord = require('tfrecord');
const path = require('path');

class SpectronHelper {
    initializeSpectron() {
        var Application = require('spectron').Application
        const electronPath = require('electron')
        const path = require('path')

        return new Application({
            path: electronPath,
            args: [path.join(__dirname, '../..')]
        })
    }

    getApplicationMenu(app) {
        return app.client.execute(() => {
            const menu = require('electron').remote.Menu.getApplicationMenu();
            return Array.prototype.map.call(menu.items, item => item.label);
        });
    }

    clickApplicationMenu(app, ...menuPath) {
        return app.client.execute((menuPath) => {
            const electron = require('electron');
            const currentWindow = electron.remote.getCurrentWindow();
            const menu = electron.remote.Menu.getApplicationMenu();
            let currentMenu = menu;
            let foundItem = null;

            for (let menuItem in menuPath) {
                for (let i = 0; i < currentMenu.items.length; i++) {
                    if (menuPath[menuItem] === currentMenu.items[i].label) {
                        foundItem = currentMenu.items[i];
                        currentMenu = currentMenu.items[i].submenu;
                        break;
                    }
                }
            }

            if (!foundItem) {
                throw new Error(`Cannot find item ${menuPath.join(' -> ')}`);
            }

            return foundItem.click(foundItem, currentWindow);
        }, menuPath);
    }

    send(app, eventName) {
        return app.client.execute((eventName) => {
            const electron = require('electron');
            const currentWindow = electron.remote.getCurrentWindow();

            return currentWindow.webContents.send(eventName);
        }, eventName);
    }

    async readRecord(pathname, recordName) {
        const reader = await tfrecord.createReader(pathname + path.sep + recordName);
        let example;
        while (example = await reader.readExample()) {
            return example;
        }
        // The reader auto-closes after it reaches the end of the file.
    }

    isApplicationMenuItemEnabled(app, ...menuPath) {
        return app.client.execute((menuPath) => {
            let currentMenu = require('electron').remote.Menu.getApplicationMenu();
            let foundItem = null;

            for (let menuItem in menuPath) {
                for (let i = 0; i < currentMenu.items.length; i++) {
                    if (menuPath[menuItem] === currentMenu.items[i].label) {
                        foundItem = currentMenu.items[i];
                        currentMenu = currentMenu.items[i].submenu;
                        break;
                    }
                }
            }

            if (!foundItem) {
                throw new Error(`Cannot find item ${menuPath.join(' -> ')}`);
            }

            return foundItem.enabled;
        }, menuPath);
    }
}

module.exports = new SpectronHelper();
