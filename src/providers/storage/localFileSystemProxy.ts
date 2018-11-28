import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { IStorageProvider } from "./storageProvider";

const PROXY_NAME = 'LocalFileSystem';

export interface LocalFileSystemProxyOptions {
    folderPath: string;
}

export class LocalFileSystemProxy implements IStorageProvider {
    constructor(private options?: LocalFileSystemProxyOptions) { }

    selectContainer(): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:selectContainer`, Array.from(arguments));
    }

    readText(fileName: string): Promise<string> {
        const filePath = [this.options.folderPath, fileName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:readText`, [filePath]);
    }

    readBinary(fileName: string): Promise<Buffer> {
        const filePath = [this.options.folderPath, fileName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:readBinary`, [filePath]);
    }

    deleteFile(fileName: string): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteFile`, [filePath]);
    }

    writeText(fileName: string, contents: string): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:writeText`, [filePath, contents]);
    }

    writeBinary(fileName: string, contents: Buffer): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:writeBinary`, [filePath, contents]);
    }

    listFiles(folderName: string): Promise<string[]> {
        const folderPath = [this.options.folderPath, folderName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:listFiles`, [folderPath]);
    }

    listContainers(folderName: string): Promise<string[]> {
        const folderPath = [this.options.folderPath, folderName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:listContainers`, [folderPath]);
    }

    createContainer(folderName: string): Promise<void> {
        const folderPath = [this.options.folderPath, folderName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:createContainer`, [folderPath]);
    }

    deleteContainer(folderName: string): Promise<void> {
        const folderPath = [this.options.folderPath, folderName].join('\\');
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteContainer`, [folderPath]);
    }
}