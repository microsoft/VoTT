import "@tensorflow/tfjs";
import fetch from "node-fetch";
import { createImageData } from "pixel-util";

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

    public async detect(buffer: ArrayBuffer, width: number, height: number): Promise<DetectedObject[]> {
        console.log("In detect");

        console.log(buffer);
        console.log(width);
        console.log(height);

        const idata = createImageData(new Uint8ClampedArray(buffer), width, height);

        console.log(idata.width);
        console.log(idata);

        try {
            const detected = await this.model.detect(idata);

            console.log(detected);

            return detected;
        } catch (error) {
            console.log(error);
        }

        return await this.model.detect(idata);
    }
}
