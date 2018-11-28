import { Deferred } from './deferred';
import { IpcProxyMessage } from '../electron/common/ipcProxy';
import * as shortid from 'shortid';

export class IpcRendererProxy {
    private static ipcRenderer;
    private static initialized: boolean = false;
    private static pending: { [id: string]: Deferred<any> } = {};

    static initialize() {
        if (IpcRendererProxy.initialized) {
            return;
        }

        IpcRendererProxy.ipcRenderer = (<any>window).require('electron').ipcRenderer;
        IpcRendererProxy.ipcRenderer.on('ipc-renderer-proxy', (sender, message: IpcProxyMessage<any>) => {
            const deferred = IpcRendererProxy.pending[message.id];
            console.log(message);
            if (!deferred) {
                throw new Error(`Cannot find deferred with id '${message.id}'`)
            }

            if (message.error) {
                deferred.reject(message.error);
            } else {
                deferred.resolve(message.result);
            }

            delete IpcRendererProxy.pending[message.id];
        });

        IpcRendererProxy.initialized = true;
    }

    static send<TResult, TArgs>(type: string, args: TArgs = undefined): Promise<TResult> {
        IpcRendererProxy.initialize();

        const id = shortid.generate();
        const deferred = new Deferred<TResult>();
        IpcRendererProxy.pending[id] = deferred;

        const outgoingArgs: IpcProxyMessage<TArgs> = {
            id: id,
            type: type,
            args: args
        };

        console.log(outgoingArgs);
        IpcRendererProxy.ipcRenderer.send('ipc-main-proxy', outgoingArgs)

        return deferred.promise;
    }
}