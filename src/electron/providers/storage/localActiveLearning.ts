import "@tensorflow/tfjs";
import fetch from "node-fetch";
import { load, ObjectDetection, DetectedObject } from "../../activelearning/objectDetection";
import { BrowserWindow, dialog } from "electron";
import { IActiveLearningProvider } from "../../../providers/activeLearning/activeLearningProxy";

export default class LocalActiveLearning implements IActiveLearningProvider {
    // TensorFlow model used for Active Learning
    private model: ObjectDetection;

    constructor(private browserWindow: BrowserWindow) {
    }

    public async setup() {
        global["fetch"] = fetch;

        // Load standard TensorFlow.js SSD Model trained on COCO dataset
        this.model = await load("mobilenet_v2");
    }

    public detect(image: ImageData): Promise<DetectedObject[]> {
        console.log("In detect");
        console.log(image);
        console.log(this.model);

        const detected = this.model.detect(image);

        console.log(detected);

        return detected;
    }
}
