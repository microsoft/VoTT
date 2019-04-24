import * as tf from "@tensorflow/tfjs";
jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import { ObjectDetection, DetectedObject } from "./objectDetection";
import { strings } from "../../common/strings";
// tslint:disable-next-line:no-var-requires
const modelJson = require("../../../cocoSSDModel/model.json");

describe("Load an Object Detection model", () => {
    it("Load model from file system using proxy", async () => {
        const storageProviderMock = LocalFileSystemProxy as jest.Mock<LocalFileSystemProxy>;
        storageProviderMock.mockClear();

        storageProviderMock.prototype.readText = jest.fn((fileName) => {
            return Promise.resolve(JSON.stringify(modelJson));
        });

        storageProviderMock.prototype.readBinary = jest.fn((fileName) => {
            return Promise.resolve([]);
        });

        const model = new ObjectDetection();

        try {
            await model.load("path");
        } catch (_) {
            // fully loading TF model fails has it has to load also weights
        }

        expect(LocalFileSystemProxy.prototype.readText).toBeCalledWith("/model.json");

        // Coco SSD Lite default embedded model has 5 weights matrix
        expect(LocalFileSystemProxy.prototype.readBinary).toBeCalledTimes(5);

        // Modal not properly loaded as readBinary mock is not really loading the weights
        expect(model.loaded).toBeFalsy();

        const noDetection = await model.detect(null);
        expect(noDetection.length).toEqual(0);

        model.dispose();
    });

    it("Load model from http url", async () => {
        window.fetch = jest.fn().mockImplementation((url, o) => {
            if (url === "http://url/model.json") {
                return Promise.resolve({
                    ok: true,
                    json: () => modelJson,
                });
            } else {
                return Promise.resolve({
                    ok: true,
                    data: () => [],
                });
            }
        });

        const model = new ObjectDetection();

        expect(model.load("http://url")).rejects.not.toBeNull();
        expect(window.fetch).toBeCalledTimes(1);

        // Modal not properly loaded as readBinary mock is not really loading the weights
        expect(model.loaded).toBeFalsy();

        const noDetection = await model.detect(null);
        expect(noDetection.length).toEqual(0);

        model.dispose();
    });
});

describe("Test Detection on Fake Model", () => {
    beforeEach(() => {
        spyOn(tf, "loadGraphModel").and.callFake(() => {
            const model = {
                executeAsync:
                    (x: tf.Tensor) => [tf.ones([1, 1917, 90]), tf.ones([1, 1917, 1, 4])],
            };

            return model;
        });
    });

    it("ObjectDetection detect method should generate output", async () => {
        const model = new ObjectDetection();
        await model.load("path");

        const x = tf.zeros([227, 227, 3]) as tf.Tensor3D;

        const data = await model.detect(x, 1);

        expect(data).toEqual([{bbox: [227, 227, 0, 0], class: strings.tags.warnings.unknownTagName, score: 1}]);
    });
});

describe("Test predictImage on Fake Model", () => {
    beforeEach(() => {
        spyOn(tf, "loadGraphModel").and.callFake(() => {
            const model = {
                executeAsync:
                    (x: tf.Tensor) => [tf.ones([1, 1917, 90]), tf.ones([1, 1917, 1, 4])],
            };

            return model;
        });
    });

    it("predictImage on a fake image", async () => {
        const model = new ObjectDetection();
        await model.load("path");

        const x = tf.zeros([227, 227, 3]) as tf.Tensor3D;
        const regions = await model.predictImage(x, false, 1, 1);

        expect(regions.length).toEqual(20);
        expect(regions[0].boundingBox.left).toEqual(227);
        expect(regions[0].boundingBox.top).toEqual(227);
        expect(regions[0].boundingBox.width).toEqual(0);
        expect(regions[0].boundingBox.height).toEqual(0);
    });
});
