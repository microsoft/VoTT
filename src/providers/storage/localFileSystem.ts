import { IpcRendererProxy } from "../../common/ipcRendererProxy";

export default class LocalFileSystemProxy {
    async selectContainer(): Promise<string> {
        const filePaths = await IpcRendererProxy.send<string[], {}>('OPEN_LOCAL_FOLDER');
        if (!filePaths || filePaths.length === 0) {
            return;
        }

        return filePaths[0];
    }

    async writeFile(filePath, contents): Promise<void> {
        return await IpcRendererProxy.send<void, any>('WRITE_LOCAL_FILE', {
            path: filePath,
            contents: contents
        });
    }
}