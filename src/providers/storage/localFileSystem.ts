import { IpcRendererProxy } from "../../common/ipcRendererProxy";

export default class LocalFileSystemProxy {
    async selectContainer(): Promise<string> {
        try {
            const filePaths = await IpcRendererProxy.send<string[], {}>('OPEN_LOCAL_FOLDER');
            if (!filePaths || filePaths.length === 0) {
                return;
            }

            return filePaths[0];
        }
        catch (err) {
            throw err;
        }
    }
}