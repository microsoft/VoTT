import "@tensorflow/tfjs";
import * as ObjectDetection from "../../activelearning/objectDetection";
import { BrowserWindow, dialog } from "electron";
import { IActiveLearningProvider } from "../../../providers/activeLearning/activeLearningProxy";
import { strings } from "../../../common/strings";

export default class LocalFileSystem implements IActiveLearningProvider {
    // TensorFlow model used for Active Learning
    private model: ObjectDetection.ObjectDetection;

    constructor(private browserWindow: BrowserWindow) {
    }

    public async setup() {
        // Load standard TensorFlow.js SSD Model trained on COCO dataset
        this.model = await ObjectDetection.load("mobilenet_v2");
    }

    public testMethod(input: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            resolve("Proxy: " + input);
        });
    }
}
