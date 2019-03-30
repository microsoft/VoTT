import "@tensorflow/tfjs";
import * as tf from "@tensorflow/tfjs-node";
import { decode } from "jpeg-js";
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

    public async detect(buffer: ArrayBuffer): Promise<DetectedObject[]> {
        try {
            const image = decode(buffer["data"], true);
            const input = this.imageToInput(image, 3);
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

    private imageToInput = (image, numChannels: number) => {
        const values = this.imageByteArray(image, numChannels);
        const outShape: [number, number, number] = [image.height, image.width, numChannels];
        const input = tf.tensor3d(values, outShape, "int32");

        return input;
    }

    private imageByteArray = (image, numChannels: number) => {
        const pixels = image.data;
        const numPixels = image.width * image.height;
        const values = new Int32Array(numPixels * numChannels);

        for (let i = 0; i < numPixels; i++) {
          for (let channel = 0; channel < numChannels; ++channel) {
            values[i * numChannels + channel] = pixels[i * 4 + channel];
          }
        }

        return values;
    }
}
