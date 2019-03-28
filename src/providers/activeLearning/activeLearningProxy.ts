import { IpcRendererProxy } from "../../common/ipcRendererProxy";

const PROXY_NAME = "LocalActiveLearning";

/**
 * Interface for VoTT Active Learning Proxy
 * @member testMethod - Test Method
 */
export interface IActiveLearningProvider {
    testMethod(input: string): Promise<string>;
}

/**
 * Options for Local Active Learning
 * @member folderPath - Path to folder being used in provider
 */
export interface ILocalActiveLearningProxyOptions {
    folderPath: string;
}

/**
 * Active Learning Provider for Local File System. Only available in Electron application
 * Leverages the IpcRendererProxy
 */
export class LocalActiveLearningProxy implements IActiveLearningProvider {
    constructor(private options?: ILocalActiveLearningProxyOptions) {
        if (!this.options) {
            this.options = {
                folderPath: null,
            };
        }
    }

    /**
     * Test Remote API
     */
    public testMethod(input: string): Promise<string> {
        return IpcRendererProxy.send(`${PROXY_NAME}:testMethod`, [input]);
    }
}
