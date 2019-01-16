import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { IStorageProvider } from "./storageProviderFactory";
import { IAssetProvider } from "./assetProviderFactory";
import { IAsset, StorageType } from "../../models/applicationState";

const PROXY_NAME = "LocalFileSystem";

/**
 * Options for Local File System
 * @member folderPath - Path to folder being used in provider
 */
export interface ILocalFileSystemProxyOptions {
    folderPath: string;
}

/**
 * Storage Provider for Local File System. Only available in Electron application
 * Leverages the IpcRendererProxy
 */
export class LocalFileSystemProxy implements IStorageProvider, IAssetProvider {
    /**
     * @returns - StorageType.Local
     */
    public storageType: StorageType.Local;
    constructor(private options?: ILocalFileSystemProxyOptions) {
        if (!this.options) {
            this.options = {
                folderPath: null,
            };
        }
    }

    /**
     * Select container for use in provider
     */
    public selectContainer(): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:selectContainer`);
    }

    /**
     * Read text from file
     * @param fileName - Name of file from which to read text
     */
    public readText(fileName: string): Promise<string> {
        const filePath = [this.options.folderPath, fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:readText`, [filePath]);
    }

    /**
     * Read buffer from file
     * @param fileName Name of file from which to read buffer
     */
    public readBinary(fileName: string): Promise<Buffer> {
        const filePath = [this.options.folderPath, fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:readBinary`, [filePath]);
    }

    /**
     * Delete file
     * @param fileName Name of file to delete
     */
    public deleteFile(fileName: string): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteFile`, [filePath]);
    }

    /**
     * Write text to file
     * @param fileName Name of target file
     * @param contents Contents to be written
     */
    public writeText(fileName: string, contents: string): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:writeText`, [filePath, contents]);
    }

    /**
     * Write buffer to file
     * @param fileName Name of target file
     * @param contents Contents to be written
     */
    public writeBinary(fileName: string, contents: Buffer): Promise<void> {
        const filePath = [this.options.folderPath, fileName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:writeBinary`, [filePath, contents]);
    }

    /**
     * List files in directory
     * @param folderName - Name of folder from which to list files
     * @param ext - NOT CURRENTLY USED IN IMPLEMENTATION.
     */
    public listFiles(folderName?: string, ext?: string): Promise<string[]> {
        const folderPath = folderName ? [this.options.folderPath, folderName].join("/") : this.options.folderPath;
        return IpcRendererProxy.send(`${PROXY_NAME}:listFiles`, [folderPath]);
    }

    /**
     * List directories inside another directory
     * @param folderName - Directory from which to list directories
     */
    public listContainers(folderName?: string): Promise<string[]> {
        const folderPath = folderName ? [this.options.folderPath, folderName].join("/") : this.options.folderPath;
        return IpcRendererProxy.send(`${PROXY_NAME}:listContainers`, [folderPath]);
    }

    /**
     * Create local directory
     * @param folderName - Name of directory to create
     */
    public createContainer(folderName: string): Promise<void> {
        const folderPath = [this.options.folderPath, folderName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:createContainer`, [folderPath]);
    }

    /**
     * Delete directory
     * @param folderName - Name of directory to delete
     */
    public deleteContainer(folderName: string): Promise<void> {
        const folderPath = [this.options.folderPath, folderName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteContainer`, [folderPath]);
    }

    /**
     * Retrieve assets from directory
     * @param folderName - Directory containing assets
     */
    public getAssets(folderName?: string): Promise<IAsset[]> {
        const folderPath = [this.options.folderPath, folderName].join("/");
        return IpcRendererProxy.send(`${PROXY_NAME}:getAssets`, [folderPath]);
    }
}
