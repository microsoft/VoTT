import { BrowserWindow, ipcMain, IpcMain } from 'electron';
import { IpcProxyMessage } from './ipcProxy';

export type IpcProxyHandler<T> = (sender: any, args: T) => any;

export class IpcMainProxy {
    private static PROXY_EVENT_NAME: string = 'ipc-renderer-proxy';

    private ipcMain: IpcMain = ipcMain;
    private handlers: { [type: string]: IpcProxyHandler<any> } = {};

    constructor(private browserWindow: BrowserWindow) {
        this.init();
    }

    private init() {
        this.ipcMain.on('ipc-main-proxy', (sender: any, message: IpcProxyMessage<any>) => {
            const handler = this.handlers[message.type];
            if (!handler) {
                console.log(`No IPC proxy handler defined for event type '${message.type}'`)
            }

            const returnArgs: IpcProxyMessage<any> = {
                id: message.id,
                type: message.type
            };

            try {
                const handlerValue = handler(sender, message.args);
                if (handlerValue && handlerValue.then) {
                    handlerValue
                        .then(result => {
                            returnArgs.result = result;
                            this.browserWindow.webContents.send(IpcMainProxy.PROXY_EVENT_NAME, returnArgs);
                        })
                        .catch(err => {
                            returnArgs.error = err;
                            this.browserWindow.webContents.send(IpcMainProxy.PROXY_EVENT_NAME, returnArgs);
                        });
                } else {
                    returnArgs.result = handlerValue;
                    this.browserWindow.webContents.send(IpcMainProxy.PROXY_EVENT_NAME, returnArgs);
                }
            }
            catch (err) {
                returnArgs.error = err;
                this.browserWindow.webContents.send(IpcMainProxy.PROXY_EVENT_NAME, returnArgs);
            }
        });
    }

    register<T>(type: string, handler: IpcProxyHandler<T>) {
        this.handlers[type] = handler;
    }
}