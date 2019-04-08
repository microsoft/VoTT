jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import { ElectronProxyHandler } from "./electronProxyHandler";
import * as tf from "@tensorflow/tfjs";
// tslint:disable-next-line:no-var-requires
const modelJson = require("../../../cocoSSDModel/model.json");

describe("Load a model from filesystem with TF io.IOHandler", () => {
    it("Check file system proxy is correctly called", async () => {
        const storageProviderMock = LocalFileSystemProxy as jest.Mock<LocalFileSystemProxy>;
        storageProviderMock.mockClear();

        storageProviderMock.prototype.readText = jest.fn((fileName) => {
            return modelJson;
        });

        const handler = new ElectronProxyHandler("folder");
        try {
            const model = await tf.loadGraphModel(handler);
        } catch (error) {
            // fully loading TF model fails has it has to load also weights
        }

        expect(LocalFileSystemProxy.prototype.readText)
            .toBeCalledWith("/model.json");
    });
});
