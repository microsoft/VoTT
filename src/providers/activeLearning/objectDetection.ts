import axios from "axios";
import * as tf from "@tensorflow/tfjs";
import { ElectronProxyHandler } from "./electronProxyHandler";
import { LocalFileSystemProxy, ILocalFileSystemProxyOptions } from "../../providers/storage/localFileSystemProxy";

// tslint:disable-next-line:interface-name
export interface DetectedObject {
    bbox: [number, number, number, number];  // [x, y, width, height]
    class: string;
    score: number;
}

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

    public async load(modelFolderPath: string, classesPath?: string) {
        try {
            if (modelFolderPath.toLowerCase().startsWith("http://") ||
                modelFolderPath.toLowerCase().startsWith("https://")) {
                this.model = await tf.loadGraphModel(modelFolderPath + "/model.json");

                const response = await axios.get(classesPath);
                this.jsonClasses = JSON.parse(response.data);
            } else {
                if (modelFolderPath.toLowerCase().startsWith("file://")) {
                    modelFolderPath = modelFolderPath.substring(7);
                }
                const handler = new ElectronProxyHandler(modelFolderPath);
                this.model = await tf.loadGraphModel(handler);

                const provider = new LocalFileSystemProxy();
                this.jsonClasses = JSON.parse(await provider.readText(modelFolderPath + "/classes.json"));
            }

            // Warmup the model.
            const result = await this.model.executeAsync(tf.zeros([1, 300, 300, 3])) as
                tf.Tensor[];
            result.map(async (t) => await t.data());
            result.map(async (t) => t.dispose());
            this.modelLoaded = true;
        } catch (error) {
            this.modelLoaded = false;
        }
    }

    /**
     * Detect objects for an image returning a list of bounding boxes with
     * assocated class and score.
     *
     * @param img The image to detect objects from. Can be a tensor or a DOM
     *     element image, video, or canvas.
     * @param maxNumBoxes The maximum number of bounding boxes of detected
     * objects. There can be multiple objects of the same class, but at different
     * locations. Defaults to 20.
     *
     */
    public async detect(img: tf.Tensor3D|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement,
                        maxNumBoxes: number = 20): Promise<DetectedObject[]> {
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
     /* istanbul ignore next */
    private async infer(img: tf.Tensor3D|ImageData|HTMLImageElement|HTMLCanvasElement| HTMLVideoElement,
                        maxNumBoxes: number): Promise<DetectedObject[]> {
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
            const boxes2 =
                tf.tensor2d(boxes, [result[1].shape[1], result[1].shape[3]]);
            return tf.image.nonMaxSuppression(
                boxes2, maxScores, maxNumBoxes, 0.5, 0.5);
        });

        const indexes = indexTensor.dataSync() as Float32Array;
        indexTensor.dispose();

        // restore previous backend
        tf.setBackend(prevBackend);

        return this.buildDetectedObjects(width, height, boxes, maxScores, indexes, classes);
    }

    /* istanbul ignore next */
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

    /* istanbul ignore next */
    private getClass(index: number, indexes: Float32Array, classes: number[]): string {
        if (index < indexes.length && indexes[index] < classes.length) {
            const classId = classes[indexes[index]] - 1;
            const classObject = this.jsonClasses[classId];
            return classObject ? classObject.displayName : "";
        }

        return "";
    }

    /* istanbul ignore next */
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
