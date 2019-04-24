import axios from "axios";
import * as shortid from "shortid";
import * as tf from "@tensorflow/tfjs";
import { ElectronProxyHandler } from "./electronProxyHandler";
import { IRegion, RegionType } from "../../models/applicationState";
import { strings } from "../../common/strings";

// tslint:disable-next-line:interface-over-type-literal
export type DetectedObject = {
    bbox: [number, number, number, number];  // [x, y, width, height]
    class: string;
    score: number;
};

/**
 * Defines supported data types supported by Tensorflow JS
 */
export type ImageObject = tf.Tensor3D | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

/**
 * Object Dectection loads active learning models and predicts regions
 */
export class ObjectDetection {
    private modelLoaded: boolean = false;

    get loaded(): boolean {
        return this.modelLoaded;
    }

    private model: tf.GraphModel;
    private jsonClasses: JSON;

    /**
     * Dispose the tensors allocated by the model. You should call this when you
     * are done with the model.
     */
    public dispose() {
        if (this.model) {
            this.model.dispose();
        }
    }

    /**
     * Load a TensorFlow.js Object Detection model from file: or http URL.
     * @param modelFolderPath file: or http URL to the model
     */
    public async load(modelFolderPath: string) {
        try {
            if (modelFolderPath.toLowerCase().startsWith("http://") ||
                modelFolderPath.toLowerCase().startsWith("https://")) {
                this.model = await tf.loadGraphModel(modelFolderPath + "/model.json");

                const response = await axios.get(modelFolderPath + "/classes.json");
                this.jsonClasses = JSON.parse(JSON.stringify(response.data));
            } else {
                const handler = new ElectronProxyHandler(modelFolderPath);
                this.model = await tf.loadGraphModel(handler);
                this.jsonClasses = await handler.loadClasses();
            }

            // Warmup the model.
            const result = await this.model.executeAsync(tf.zeros([1, 300, 300, 3])) as tf.Tensor[];
            result.forEach(async (t) => await t.data());
            result.forEach(async (t) => t.dispose());
            this.modelLoaded = true;
        } catch (err) {
            this.modelLoaded = false;
            throw err;
        }
    }

    /**
     * Predict Regions from an HTMLImageElement returning list of IRegion.
     * @param image ImageObject to be used for prediction
     * @param predictTag Flag indicates if predict only region bounding box of tag too.
     * @param xRatio Width compression ratio between the HTMLImageElement and the original image.
     * @param yRatio Height compression ratio between the HTMLImageElement and the original image.
     */
    public async predictImage(image: ImageObject, predictTag: boolean, xRatio: number, yRatio: number)
        : Promise<IRegion[]> {
        const regions: IRegion[] = [];

        const predictions = await this.detect(image);
        predictions.forEach((prediction) => {
            const left = Math.max(0, prediction.bbox[0] * xRatio);
            const top = Math.max(0, prediction.bbox[1] * yRatio);
            const width = Math.max(0, prediction.bbox[2] * xRatio);
            const height = Math.max(0, prediction.bbox[3] * yRatio);

            regions.push({
                id: shortid.generate(),
                type: RegionType.Rectangle,
                tags: predictTag ? [prediction.class] : [],
                boundingBox: {
                    left,
                    top,
                    width,
                    height,
                },
                points: [{
                    x: left,
                    y: top,
                },
                {
                    x: left + width,
                    y: top,
                },
                {
                    x: left + width,
                    y: top + height,
                },
                {
                    x: left,
                    y: top + height,
                }],
            });
        });

        return regions;
    }

    /**
     * Detect objects for an image returning a list of bounding boxes with
     * associated class and score.
     *
     * @param img The image to detect objects from. Can be a tensor or a DOM
     *     element image, video, or canvas.
     * @param maxNumBoxes The maximum number of bounding boxes of detected
     * objects. There can be multiple objects of the same class, but at different
     * locations. Defaults to 20.
     *
     */
    public async detect(img: ImageObject, maxNumBoxes: number = 20): Promise<DetectedObject[]> {
        if (this.model) {
            return this.infer(img, maxNumBoxes);
        }

        return [];
    }

    /**
     * Infers through the model.
     *
     * @param img The image to classify. Can be a tensor or a DOM element image,
     * video, or canvas.
     * @param maxNumBoxes The maximum number of bounding boxes of detected
     * objects. There can be multiple objects of the same class, but at different
     * locations. Defaults to 20.
     */
    private async infer(img: ImageObject, maxNumBoxes: number = 20): Promise<DetectedObject[]> {
        const batched = tf.tidy(() => {
            if (!(img instanceof tf.Tensor)) {
                img = tf.browser.fromPixels(img);
            }
            // Reshape to a single-element batch so we can pass it to executeAsync.
            return img.expandDims(0);
        });
        const height = batched.shape[1];
        const width = batched.shape[2];

        // model returns two tensors:
        // 1. box classification score with shape of [1, 1917, 90]
        // 2. box location with shape of [1, 1917, 1, 4]
        // where 1917 is the number of box detectors, 90 is the number of classes.
        // and 4 is the four coordinates of the box.
        const result = await this.model.executeAsync(batched) as tf.Tensor[];

        const scores = result[0].dataSync() as Float32Array;
        const boxes = result[1].dataSync() as Float32Array;

        // clean the webgl tensors
        batched.dispose();
        tf.dispose(result);

        const [maxScores, classes] = this.calculateMaxScores(scores, result[0].shape[1], result[0].shape[2]);

        const prevBackend = tf.getBackend();
        // run post process in cpu
        tf.setBackend("cpu");
        const indexTensor = tf.tidy(() => {
            const boxes2 = tf.tensor2d(boxes, [result[1].shape[1], result[1].shape[3]]);
            return tf.image.nonMaxSuppression(boxes2, maxScores, maxNumBoxes, 0.5, 0.5);
        });

        const indexes = indexTensor.dataSync() as Float32Array;
        indexTensor.dispose();

        // restore previous backend
        tf.setBackend(prevBackend);

        return this.buildDetectedObjects(width, height, boxes, maxScores, indexes, classes);
    }

    private buildDetectedObjects(
        width: number, height: number, boxes: Float32Array, scores: number[],
        indexes: Float32Array, classes: number[]): DetectedObject[] {
        const count = indexes.length;
        const objects: DetectedObject[] = [];

        for (let i = 0; i < count; i++) {
            const bbox = [];
            for (let j = 0; j < 4; j++) {
                bbox[j] = boxes[indexes[i] * 4 + j];
            }
            const minY = bbox[0] * height;
            const minX = bbox[1] * width;
            const maxY = bbox[2] * height;
            const maxX = bbox[3] * width;
            bbox[0] = minX;
            bbox[1] = minY;
            bbox[2] = maxX - minX;
            bbox[3] = maxY - minY;
            objects.push({
                bbox: bbox as [number, number, number, number],
                class: this.getClass(i, indexes, classes),
                score: scores[indexes[i]],
            });
        }

        return objects;
    }

    private getClass(index: number, indexes: Float32Array, classes: number[]): string {
        if (this.jsonClasses && index < indexes.length && indexes[index] < classes.length) {
            const classId = classes[indexes[index]] - 1;
            const classObject = this.jsonClasses[classId];

            return classObject ? classObject.displayName : strings.tags.warnings.unknownTagName;
        }

        return "";
    }

    private calculateMaxScores(
        scores: Float32Array, numBoxes: number,
        numClasses: number): [number[], number[]] {
        const maxes = [];
        const classes = [];
        for (let i = 0; i < numBoxes; i++) {
            let max = Number.MIN_VALUE;
            let index = -1;
            for (let j = 0; j < numClasses; j++) {
                if (scores[i * numClasses + j] > max) {
                    max = scores[i * numClasses + j];
                    index = j;
                }
            }
            maxes[i] = max;
            classes[i] = index;
        }
        return [maxes, classes];
    }
}
