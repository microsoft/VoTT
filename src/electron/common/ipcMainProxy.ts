import { BrowserWindow, IpcMain } from "electron";
import { IpcProxyMessage } from "./ipcProxy";

export type IpcProxyHandler<T> = (sender: any, args: T) => any;

export class IpcMainProxy {
    private static PROXY_EVENT_NAME: string = "ipc-renderer-proxy";

    public handlers: { [type: string]: IpcProxyHandler<any> } = {};

    constructor(private ipcMain: IpcMain, private browserWindow: BrowserWindow) {
        this.init();
    }

    public register<T>(type: string, handler: IpcProxyHandler<T>) {
        this.handlers[type] = handler;
    }

    public registerProxy(proxyPrefix, provider) {
        Object.getOwnPropertyNames(provider.__proto__).forEach((memberName) => {
            if (typeof (provider[memberName]) === "function") {
                this.register(`${proxyPrefix}:${memberName}`, (sender: any, eventArgs: any[]) => {
                    return provider[memberName].apply(provider, eventArgs);
                });
            }
        });
    }

    private init() {
        this.ipcMain.on("ipc-main-proxy", (sender: any, message: IpcProxyMessage<any>) => {
            const handler = this.handlers[message.type];
            if (!handler) {
                console.log(`No IPC proxy handler defined for event type '${message.type}'`);
            }

            const returnArgs: IpcProxyMessage<any> = {
                id: message.id,
                type: message.type,
            };

            try {
                returnArgs.debug = JSON.stringify(message.args);

                const handlerValue = handler(sender, message.args);
                if (handlerValue && handlerValue.then) {
                    handlerValue
                        .then((result) => {
                            returnArgs.result = result;
                            this.browserWindow.webContents.send(IpcMainProxy.PROXY_EVENT_NAME, returnArgs);
                        })
                        .catch((err) => {
                            returnArgs.error = err;
                            this.browserWindow.webContents.send(IpcMainProxy.PROXY_EVENT_NAME, returnArgs);
                        });
                } else {
                    returnArgs.result = handlerValue;
                    this.browserWindow.webContents.send(IpcMainProxy.PROXY_EVENT_NAME, returnArgs);
                }
            } catch (err) {
                returnArgs.error = err;
                this.browserWindow.webContents.send(IpcMainProxy.PROXY_EVENT_NAME, returnArgs);
            }
        });
    }
}
