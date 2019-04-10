import axios, { AxiosResponse } from "axios";
jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import { ObjectDetection, DetectedObject } from "./objectDetection";
import * as tf from "@tensorflow/tfjs";
// tslint:disable-next-line:no-var-requires
const modelJson = require("../../../cocoSSDModel/model.json");

describe("Load an Object Detection model", () => {
    it("Load model from file system using proxy", async () => {
        const storageProviderMock = LocalFileSystemProxy as jest.Mock<LocalFileSystemProxy>;
        storageProviderMock.mockClear();

        storageProviderMock.prototype.readText = jest.fn((fileName) => {
            return JSON.stringify(modelJson);
        });

        storageProviderMock.prototype.readBinary = jest.fn((fileName) => {
            return [];
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
        const originalLoadGraphModel = tf.loadGraphModel;
        tf.loadGraphModel = jest.fn((modelPath) => {
            return originalLoadGraphModel(modelPath, {fetchFunc: (url, o) => {
                console.log(url, o);
                return JSON.stringify(modelJson);
            }});
        });

        const model = new ObjectDetection();

        await model.load("http://url");

        expect(tf.loadGraphModel).toBeCalledTimes(1);

        // Modal not properly loaded as readBinary mock is not really loading the weights
        expect(model.loaded).toBeFalsy();

        const noDetection = await model.detect(null);
        expect(noDetection.length).toEqual(0);

        model.dispose();
    });
});
