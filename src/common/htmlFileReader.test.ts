import axios, { AxiosResponse } from "axios";
import HtmlFileReader from "./htmlFileReader";
import { AssetService } from "../services/assetService";
import { TFRecordsBuilder, FeatureType } from "../providers/export/tensorFlowRecords/tensorFlowBuilder";

describe("Html File Reader", () => {
    it("Resolves promise after successfully reading file", async () => {
        const expectedText = "test file contents";
        const blob = new Blob([expectedText], { type: "text/plain" });
        const file = new File([blob], "test.txt");

        const actualText = await HtmlFileReader.readAsText(file);
        expect(actualText).toEqual(expectedText);
    });

    it("Throws error with null file value", () => {
        expect(() => HtmlFileReader.readAsText(null)).toThrowError();
    });

    it("Loads attributes for HTML 5 video", async () => {
        const expected = {
            width: 1920,
            height: 1080,
            duration: 1000,
        };

        document.createElement = jest.fn(() => {
            const element: any = {
                videoWidth: expected.width,
                videoHeight: expected.height,
                duration: expected.duration,
                onloadedmetadata: jest.fn(),
            };

            setImmediate(() => {
                element.onloadedmetadata();
            });

            return element;
        });

        const videoAsset = AssetService.createAssetFromFilePath("https://server.com/video.mp4");
        const result = await HtmlFileReader.readAssetAttributes(videoAsset);

        expect(result.width).toEqual(expected.width);
        expect(result.height).toEqual(expected.height);
        expect(result.duration).toEqual(expected.duration);
    });

    it("Loads attributes for an image asset", async () => {
        const expected = {
            width: 1920,
            height: 1080,
        };

        document.createElement = jest.fn(() => {
            const element: any = {
                naturalWidth: expected.width,
                naturalHeight: expected.height,
                onload: jest.fn(),
            };

            setImmediate(() => {
                element.onload();
            });

            return element;
        });

        const imageAsset = AssetService.createAssetFromFilePath("https://server.com/image.jpg");
        const result = await HtmlFileReader.readAssetAttributes(imageAsset);

        expect(result.width).toEqual(expected.width);
        expect(result.height).toEqual(expected.height);
    });

    describe("Download asset binaries", () => {
        it("Downloads a blob from the asset path", async () => {
            const asset = AssetService.createAssetFromFilePath("https://server.com/image.jpg");
            axios.get = jest.fn((url, config) => {
                return Promise.resolve<AxiosResponse>({
                    config,
                    headers: null,
                    status: 200,
                    statusText: "OK",
                    data: new Blob(["Some binary data"]),
                });
            });

            const result = await HtmlFileReader.getAssetBlob(asset);
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(Blob);
            expect(axios.get).toBeCalledWith(asset.path, { responseType: "blob" });
        });

        it("Rejects the promise when request receives non 200 result", async () => {
            const asset = AssetService.createAssetFromFilePath("https://server.com/image.jpg");
            axios.get = jest.fn((url, config) => {
                return Promise.resolve<AxiosResponse>({
                    config,
                    headers: null,
                    status: 404,
                    statusText: "Not Found",
                    data: null,
                });
            });

            await expect(HtmlFileReader.getAssetBlob(asset)).rejects.not.toBeNull();
            expect(axios.get).toBeCalledWith(asset.path, { responseType: "blob" });
        });
    });

    describe("Download asset binaries array", () => {
        beforeEach(() => {
            axios.get = jest.fn((url, config) => {
                return Promise.resolve<AxiosResponse>({
                    config,
                    headers: null,
                    status: 200,
                    statusText: "OK",
                    data: [1, 2, 3],
                });
            });
        });

        it("Downloads a byte array from the asset path", async () => {
            const asset = AssetService.createAssetFromFilePath("https://server.com/image.jpg");
            const result = await HtmlFileReader.getAssetArray(asset);
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(Uint8Array);
            expect(axios.get).toBeCalledWith(asset.path, { responseType: "blob" });
        });

        it("Test non valid asset type", async () => {
            const imageAsset = AssetService.createAssetFromFilePath("https://server.com/image.notsupported");
            try {
                const result = await HtmlFileReader.readAssetAttributes(imageAsset);
            } catch (error) {
                expect(error).toEqual(new Error("Asset not supported"));
            }
        });
    });

    describe("Test TFRecords", () => {
        it("Loads attributes for a tfrecord asset", async () => {
            const expected = {
                width: 1920,
                height: 1080,
            };

            axios.get = jest.fn((url, config) => {
                const builder = new TFRecordsBuilder();
                builder.addFeature("image/height", FeatureType.Int64, expected.height);
                builder.addFeature("image/width", FeatureType.Int64, expected.width);
                const buffer = builder.build();
                const tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);

                return Promise.resolve<AxiosResponse>({
                    config,
                    headers: null,
                    status: 200,
                    statusText: "OK",
                    data: tfrecords,
                });
            });

            const imageAsset = AssetService.createAssetFromFilePath("https://server.com/image.tfrecord");
            const result = await HtmlFileReader.readAssetAttributes(imageAsset);

            expect(result.width).toEqual(expected.width);
            expect(result.height).toEqual(expected.height);
        });
    });

    describe("Test TFRecords", () => {
        it("Loads attributes for an tfrecord asset", async () => {
            const expected = {
                width: 1920,
                height: 1080,
            };

            axios.get = jest.fn((url, config) => {
                const builder = new TFRecordsBuilder();
                builder.addFeature("image/height", FeatureType.Int64, expected.height);
                builder.addFeature("image/width", FeatureType.Int64, expected.width);
                const buffer = builder.build();
                const tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);

                return Promise.resolve<AxiosResponse>({
                    config,
                    headers: null,
                    status: 200,
                    statusText: "OK",
                    data: tfrecords,
                });
            });

            const imageAsset = AssetService.createAssetFromFilePath("https://server.com/image.tfrecord");
            const result = await HtmlFileReader.readAssetAttributes(imageAsset);

            expect(result.width).toEqual(expected.width);
            expect(result.height).toEqual(expected.height);
        });
    });
});
