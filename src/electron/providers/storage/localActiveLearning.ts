import "@tensorflow/tfjs";
import * as tf from "@tensorflow/tfjs-node";
import fetch from "node-fetch";
import { load, ObjectDetection, DetectedObject } from "../../activelearning/objectDetection";
import { BrowserWindow, dialog } from "electron";
import { IActiveLearningProvider } from "../../../providers/activeLearning/activeLearningProxy";
import { reject } from "q";

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
        const pixels = buffer["data"];
        try {
            const input = this.imageToInput(pixels, width, height, 3);
            const detected = await this.model.detect(input);

            console.log(detected);

            return detected;
        } catch (error) {
            console.log(error);
        }

        return new Promise<DetectedObject[]>((resolve, reject) => {
            reject();
        });
    }

    private imageToInput = (buffer: ArrayBuffer, width: number, height: number, numChannels: number) => {
        const values = this.imageByteArray(buffer, width, height, numChannels);
        const outShape: [number, number, number] = [height, width, numChannels];
        const input = tf.tensor3d(values, outShape, "int32");

        return input;
    }

    private imageByteArray = (buffer: ArrayBuffer, width: number, height: number, numChannels: number) => {
        const numPixels = width * height;
        const values = new Int32Array(numPixels * numChannels);

        console.log(buffer.byteLength);
        console.log(values.byteLength);

        for (let i = 0; i < numPixels; i++) {
          for (let channel = 0; channel < numChannels; ++channel) {
            values[i * numChannels + channel] = buffer[i * 4 + channel];
          }
        }

        return values;
    }
}
