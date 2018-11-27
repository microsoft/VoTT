import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { IStorageProvider } from "./storageProvider";

const PROXY_NAME = 'LocalFileSystem';

export default class LocalFileSystemProxy implements IStorageProvider {
    selectContainer(): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:selectContainer`);
    }

    readText(filePath: string): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:readText`, { filePath });
    }

    readBinary(filePath: string): Promise<Buffer> {
        return IpcRendererProxy.send(`${PROXY_NAME}:readBinary`, { filePath });
    }

    deleteFile(filePath: string): Promise<void> {
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteFile`, { filePath });
    }

    writeText(filePath: string, contents: string): Promise<void> {
        return IpcRendererProxy.send(`${PROXY_NAME}:writeText`, { filePath, contents });
    }

    writeBinary(filePath: string, contents: Buffer): Promise<void> {
        return IpcRendererProxy.send(`${PROXY_NAME}:writeBinary`, { filePath, contents });
    }

    listFiles(folderPath: string): Promise<string[]> {
        return IpcRendererProxy.send(`${PROXY_NAME}:listFiles`, { folderPath });
    }

    listContainers(folderPath: string): Promise<string[]> {
        return IpcRendererProxy.send(`${PROXY_NAME}:listContainers`, { folderPath });
    }

    createContainer(folderPath: string): Promise<void> {
        return IpcRendererProxy.send(`${PROXY_NAME}:createContainer`, { folderPath });
    }

    deleteContainer(folderPath: string): Promise<void> {
        return IpcRendererProxy.send(`${PROXY_NAME}:deleteContainer`, { folderPath });
    }
}