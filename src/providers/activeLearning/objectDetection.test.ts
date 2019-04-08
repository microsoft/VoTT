jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import { ObjectDetection, DetectedObject } from "./objectDetection";
import * as tf from "@tensorflow/tfjs";
// tslint:disable-next-line:no-var-requires
const modelJson = require("../../../cocoSSDModel/model.json");

describe("Load an Object Detection model", () => {
    it("Load from file system using proxy", async () => {
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
    });
});
