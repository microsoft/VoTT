import "@tensorflow/tfjs";
import fetch from "node-fetch";
import { createCanvas } from "canvas";

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

    public detect(buffer: Buffer, width: number, height: number): Promise<DetectedObject[]> {
        console.log("In detect");

        console.log(buffer);
        console.log(width);
        console.log(height);

        const canv = createCanvas(width, height);
        const ct = canv.getContext("2d");

        // create ImageData object
        const idata: ImageData = ct.createImageData(width, height);
        idata.data.set(buffer);

        console.log(idata.width);
        console.log(idata);

        const detected = this.model.detect(idata);

        console.log(detected);

        return detected;
    }
}
