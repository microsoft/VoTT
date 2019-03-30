import "@tensorflow/tfjs";
import { DetectedObject } from "../../electron/activelearning/objectDetection";
import { IpcRendererProxy } from "../../common/ipcRendererProxy";

const PROXY_NAME = "LocalActiveLearning";

/**
 * Interface for VoTT Active Learning Proxy
 * @member detect - Detect Method
 */
export interface IActiveLearningProvider {
    detect(buffer: ArrayBuffer): Promise<DetectedObject[]>;
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
     * Detect Remote API
     */
    public async detect(buffer: ArrayBuffer): Promise<DetectedObject[]> {
        return await IpcRendererProxy.send(`${PROXY_NAME}:detect`,
            [{data: new Uint8Array(buffer)}]);
    }
}
