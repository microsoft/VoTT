import axios, { AxiosResponse } from "axios";
import HtmlFileReader from "./htmlFileReader";
import { AssetService } from "../services/assetService";
import { TFRecordsBuilder, FeatureType } from "../providers/export/tensorFlowRecords/tensorFlowBuilder";
import MockFactory from "./mockFactory";
import { AssetState, IAsset } from "../models/applicationState";

describe("Html File Reader", () => {
    const assetTestCache = new Map<string, IAsset>();

    beforeEach(() => {
        assetTestCache.clear();

        document.createElement = jest.fn((elementType) => {
            switch (elementType) {
                case "img":
                    const mockImage = MockFactory.mockImage(assetTestCache);
                    return mockImage();
                case "video":
                    const mockVideo = MockFactory.mockVideo(assetTestCache);
                    return mockVideo();
                case "canvas":
                    const mockCanvas = MockFactory.mockCanvas();
                    return mockCanvas();
            }
        });
    });

    it("Resolves promise after successfully reading file", async () => {
        const expectedText = "test file contents";
        const blob = new Blob([expectedText], { type: "text/plain" });
        const file = new File([blob], "test.txt");

        const actualText = await HtmlFileReader.readAsText(file);
        expect(actualText.content).toEqual(expectedText);
    });

    it("Throws error with null file value", () => {
        expect(() => HtmlFileReader.readAsText(null)).toThrowError();
    });

    it("Loads attributes for HTML 5 video", async () => {
        const videoAsset = AssetService.createAssetFromFilePath("https://server.com/video.mp4");
        videoAsset.size = {
            width: 1920,
            height: 1080,
        };
        assetTestCache.set(videoAsset.path, videoAsset);

        const result = await HtmlFileReader.readAssetAttributes(videoAsset);

        expect(result.width).toEqual(videoAsset.size.width);
        expect(result.height).toEqual(videoAsset.size.height);
    });

    it("Loads attributes for an image asset", async () => {
        const imageAsset = AssetService.createAssetFromFilePath("https://server.com/image.jpg");
        imageAsset.size = {
            width: 1920,
            height: 1080,
        };
        assetTestCache.set(imageAsset.path, imageAsset);

        const result = await HtmlFileReader.readAssetAttributes(imageAsset);

        expect(result.width).toEqual(imageAsset.size.width);
        expect(result.height).toEqual(imageAsset.size.height);
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
            expect(result).toBeInstanceOf(ArrayBuffer);
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

    describe("Extracting video frames", () => {
        it("Gets a blob for the requested video frame", async () => {
            const videoAsset = MockFactory.createVideoTestAsset("VideoTestAsset-1", AssetState.Tagged);
            const videoFrame = MockFactory.createChildVideoAsset(videoAsset, 123.456);
            assetTestCache.set(videoFrame.parent.path, videoFrame);

            const blob = await HtmlFileReader.getAssetFrameImage(videoFrame);
            expect(blob).not.toBeNull();
            expect(blob).toBeInstanceOf(Blob);
        });

        it("Appends jpg file extension on specified video frame asset", async () => {
            const videoAsset = MockFactory.createVideoTestAsset("VideoTestAsset-2", AssetState.Tagged);
            const videoFrame = MockFactory.createChildVideoAsset(videoAsset, 456.789);
            assetTestCache.set(videoFrame.parent.path, videoFrame);

            expect(videoFrame.name.endsWith(".jpg")).toBe(false);
            await HtmlFileReader.getAssetFrameImage(videoFrame);
            expect(videoFrame.name.endsWith(".jpg")).toBe(true);
        });

        it("Does not duplicate jpg file extension on specified video frame asset", async () => {
            const videoAsset = MockFactory.createVideoTestAsset("VideoTestAsset-3", AssetState.Tagged);
            const videoFrame = MockFactory.createChildVideoAsset(videoAsset, 456.789);
            videoFrame.name += ".jpg";
            assetTestCache.set(videoFrame.parent.path, videoFrame);

            expect(videoFrame.name.endsWith(".jpg")).toBe(true);
            await HtmlFileReader.getAssetFrameImage(videoFrame);
            expect(videoFrame.name.endsWith(".jpg")).toBe(true);
            expect(videoFrame.name.endsWith(".jpg.jpg")).toBe(false);
        });

        it("Throws an error when a video error occurs", async () => {
            const videoErrorAsset = MockFactory.createVideoTestAsset("VideoErrorAsset", AssetState.Tagged);
            const videoErrorFrame = MockFactory.createChildVideoAsset(videoErrorAsset, 123.456);
            assetTestCache.set(videoErrorAsset.path, videoErrorFrame);

            await expect(HtmlFileReader.getAssetFrameImage(videoErrorFrame)).rejects.not.toBeNull();
        });
    });
});
