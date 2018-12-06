import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { IStorageProvider } from "./storageProvider";
import { IAssetProvider } from "./assetProvider";
import { IAsset } from "../../models/applicationState";

const PROXY_NAME = "LocalFileSystem";

export interface ILocalFileSystemProxyOptions {
    folderPath: string;
}

export class LocalFileSystemProxy implements IStorageProvider, IAssetProvider {
    constructor(private options?: ILocalFileSystemProxyOptions) {
        if (!this.options) {
            this.options = {
                folderPath: null,
            };
        }
    }

    public selectContainer(): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:selectContainer`);
    }

    public readText(fileName: string): Promise<string> {
        const filePath = [this.options.folderPath, fileName].join("\\");
        return IpcRendererProxy.send(`${PROXY_NAME}:readText`, [filePath]);
    }

    public readBinary(fileName: string): Promise<Buffer> {
        const filePath = [this.options.folderPath, fileName].join("\\");
        return IpcRendererProxy.send(`${PROXY_NAME}:readBinary`, [filePath]);
    }

    public deleteFile(fileName: string): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join("\\");
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteFile`, [filePath]);
    }

    public writeText(fileName: string, contents: string): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join("\\");
        return IpcRendererProxy.send(`${PROXY_NAME}:writeText`, [filePath, contents]);
    }

    public writeBinary(fileName: string, contents: Buffer): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join("\\");
        return IpcRendererProxy.send(`${PROXY_NAME}:writeBinary`, [filePath, contents]);
    }

    public listFiles(folderName?: string): Promise<string[]> {
        const folderPath = folderName ? [this.options.folderPath, folderName].join("\\") : this.options.folderPath;
        return IpcRendererProxy.send(`${PROXY_NAME}:listFiles`, [folderPath]);
    }

    public listContainers(folderName?: string): Promise<string[]> {
        const folderPath = folderName ? [this.options.folderPath, folderName].join("\\") : this.options.folderPath;
        return IpcRendererProxy.send(`${PROXY_NAME}:listContainers`, [folderPath]);
    }

    public createContainer(folderName: string): Promise<void> {
        const folderPath = [this.options.folderPath, folderName].join("\\");
        return IpcRendererProxy.send(`${PROXY_NAME}:createContainer`, [folderPath]);
    }

    public deleteContainer(folderName: string): Promise<void> {
        const folderPath = [this.options.folderPath, folderName].join("\\");
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteContainer`, [folderPath]);
    }

    public getAssets(folderName?: string): Promise<IAsset[]> {
        const folderPath = [this.options.folderPath, folderName].join("\\");
        return IpcRendererProxy.send(`${PROXY_NAME}:getAssets`, [folderPath]);
    }
}
