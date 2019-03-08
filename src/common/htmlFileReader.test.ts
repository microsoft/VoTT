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
                    return mockImage();
                case "video":
                    return mockVideo();
                case "canvas":
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
        const videoAsset = MockFactory.createVideoTestAsset("VideoTestAsset", AssetState.Tagged);
        const videoFrame = MockFactory.createChildVideoAsset(videoAsset, 123.456);

        beforeEach(() => {
            assetTestCache.set(videoFrame.parent.path, videoFrame);
        });

        it("Gets a blob for the requested video frame", async () => {
            const blob = await HtmlFileReader.getAssetFrameImage(videoFrame);
            expect(blob).not.toBeNull();
            expect(blob).toBeInstanceOf(Blob);
        });

        it("Appends jpg file extension on specified asset", async () => {
            await HtmlFileReader.getAssetFrameImage(videoFrame);
            expect(videoFrame.name.endsWith(".jpg"));
        });

        it("Throws an error when a video error occurs", async () => {
            const videoErrorAsset = MockFactory.createVideoTestAsset("VideoErrorAsset", AssetState.Tagged);
            const videoErrorFrame = MockFactory.createChildVideoAsset(videoErrorAsset, 123.456);
            assetTestCache.set(videoErrorAsset.path, videoErrorFrame);

            await expect(HtmlFileReader.getAssetFrameImage(videoErrorFrame)).rejects.not.toBeNull();
        });
    });

    const mockImage = jest.fn(() => {
        const element: any = {
            naturalWidth: 0,
            naturalHeight: 0,
            onload: jest.fn(),
        };

        setImmediate(() => {
            const asset = assetTestCache.get(element.src);
            element.naturalWidth = asset.size.width;
            element.naturalHeight = asset.size.height;

            element.onload();
        });

        return element;
    });

    const mockVideo = jest.fn(() => {
        const element: any = {
            src: "",
            duration: 0,
            currentTime: 0,
            videoWidth: 0,
            videoHeight: 0,
            onloadedmetadata: jest.fn(),
            onseeked: jest.fn(),
            onerror: jest.fn(),
        };

        setImmediate(() => {
            const asset = assetTestCache.get(element.src);
            if (asset.name.toLowerCase().indexOf("error") > -1) {
                element.onerror("An error occurred loading the video");
            } else {
                element.videoWidth = asset.size.width;
                element.videoHeight = asset.size.height;
                element.currentTime = asset.timestamp;
                element.onloadedmetadata();
                element.onseeked();
            }
        });

        return element;
    });

    const mockCanvas = jest.fn(() => {
        const canvas: any = {
            width: 0,
            height: 0,
            getContext: jest.fn(() => {
                return {
                    drawImage: jest.fn(),
                };
            }),
            toBlob: jest.fn((callback) => {
                callback(new Blob(["Binary image data"]));
            }),
        };

        return canvas;
    });
});
