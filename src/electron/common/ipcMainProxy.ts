import { BrowserWindow, IpcMain } from 'electron';
import { IpcProxyMessage } from './ipcProxy';

export type IpcProxyHandler<T> = (sender: any, args: T) => any;

export class IpcMainProxy {
    private static PROXY_EVENT_NAME: string = 'ipc-renderer-proxy';

    handlers: { [type: string]: IpcProxyHandler<any> } = {};

    constructor(private ipcMain: IpcMain, private browserWindow: BrowserWindow) {
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

    registerProxy(proxyPrefix, provider) {
        Object.getOwnPropertyNames(provider.__proto__).forEach(memberName => {
            if (typeof (provider[memberName]) === 'function') {
                console.log(`Registering ${proxyPrefix}:${memberName}`);
                this.register(`${proxyPrefix}:${memberName}`, (sender, eventArgs) => {
                    const args = Object.getOwnPropertyNames(eventArgs).map(memberName => eventArgs[memberName]);
                    return provider[memberName].apply(provider, args);
                });
            }
        });
    }
}