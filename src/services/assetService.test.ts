import { AssetService } from "./assetService";
import { AssetType, IAssetMetadata, AssetState } from "../models/applicationState";
import MockFactory from "../common/mockFactory";
import { AssetProviderFactory, IAssetProvider } from "../providers/storage/assetProviderFactory";
import { StorageProviderFactory, IStorageProvider } from "../providers/storage/storageProviderFactory";
import { constants } from "../common/constants";
import { TFRecordsBuilder, FeatureType } from "../providers/export/tensorFlowRecords/tensorFlowBuilder";
import HtmlFileReader from "../common/htmlFileReader";

describe("Asset Service", () => {
    describe("Static Methods", () => {
        it("creates an asset from a file path", () => {
            const path = "C:\\dir1\\dir2\\asset1.jpg";
            const asset = AssetService.createAssetFromFilePath(path);

            expect(asset).not.toBeNull();
            expect(asset.id).toEqual(expect.any(String));
            expect(asset.name).toEqual("asset1.jpg");
            expect(asset.type).toEqual(AssetType.Image);
            expect(asset.path).toEqual(path);
            expect(asset.format).toEqual("jpg");
        });

        it("creates an asset from an encoded file", () => {
            const path = "C:\\dir1\\dir2\\asset%201.jpg";
            const asset = AssetService.createAssetFromFilePath(path);

            expect(asset).not.toBeNull();
            expect(asset.id).toEqual(expect.any(String));
            expect(asset.name).toEqual("asset%201.jpg");
            expect(asset.type).toEqual(AssetType.Image);
            expect(asset.path).toEqual(path);
            expect(asset.format).toEqual("jpg");
        });

        it("creates an asset from a http source", () => {
            const path = "http://my.server.com/asset1.jpg";
            const asset = AssetService.createAssetFromFilePath(path);

            expect(asset).not.toBeNull();
            expect(asset.id).toEqual(expect.any(String));
            expect(asset.name).toEqual("asset1.jpg");
            expect(asset.type).toEqual(AssetType.Image);
            expect(asset.path).toEqual(path);
            expect(asset.format).toEqual("jpg");
        });

        it("detects an image asset by common file extension", () => {
            const path = "C:\\dir1\\dir2\\asset1.png";
            const asset = AssetService.createAssetFromFilePath(path);
            expect(asset.type).toEqual(AssetType.Image);
        });

        it("detects a video asset by common file extension", () => {
            const path = "C:\\dir1\\dir2\\asset1.mp4";
            const asset = AssetService.createAssetFromFilePath(path);
            expect(asset.type).toEqual(AssetType.Video);
        });

        it("detects a tfrecord asset by common file extension", () => {
            const path = "C:\\dir1\\dir2\\asset1.tfrecord";
            const asset = AssetService.createAssetFromFilePath(path);
            expect(asset.type).toEqual(AssetType.TFRecord);
        });

        it("detects an asset as unkonwn if it doesn't match well known file extensions", () => {
            const path = "C:\\dir1\\dir2\\asset1.docx";
            const asset = AssetService.createAssetFromFilePath(path);
            expect(asset.type).toEqual(AssetType.Unknown);
        });
    });

    describe("Instance Methods", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createTestAssets(10);
        let assetService: AssetService = null;
        let assetProviderMock: IAssetProvider = null;
        let storageProviderMock: any = null;

        beforeEach(() => {
            assetProviderMock = {
                getAssets: () => Promise.resolve(testAssets),
            };

            storageProviderMock = {
                readText: jest.fn((filePath) => {
                    const assetMetadata: IAssetMetadata = {
                        asset: testAssets[0],
                        regions: [],
                    };

                    return JSON.stringify(assetMetadata, null, 4);
                }),
                writeText: jest.fn((filePath, contents) => true),
            };

            AssetProviderFactory.create = jest.fn(() => assetProviderMock);
            StorageProviderFactory.create = jest.fn(() => storageProviderMock);

            assetService = new AssetService(testProject);
        });

        it("Save throws error with null value", async () => {
            await expect(assetService.save(null)).rejects.not.toBeNull();
        });

        it("Loads the asset metadata from the underlying storage provider when the file exists", async () => {
            const asset = testAssets[0];
            const result = await assetService.getAssetMetadata(asset);

            expect(result).not.toBeNull();
            expect(result.asset).toEqual(asset);
        });

        it("Loads the asset metadata from the asset when file does not exist", async () => {
            const expectedError = new Error("File not found");

            storageProviderMock.writeText.mockImplementationOnce(() => { throw expectedError; });

            const asset = testAssets[0];
            const result = await assetService.getAssetMetadata(asset);

            expect(result).not.toBeNull();
            expect(result.asset).toEqual(asset);
        });

        it("Saves asset JSON to underlying storage provider", async () => {
            const assetMetadata: IAssetMetadata = {
                asset: {
                    ...testAssets[0],
                    state: AssetState.Tagged,
                },
                regions: [],
            };

            const result = await assetService.save(assetMetadata);

            expect(storageProviderMock.writeText).toBeCalledWith(
                `${assetMetadata.asset.id}${constants.assetMetadataFileExtension}`,
                JSON.stringify(assetMetadata, null, 4),
            );
            expect(result).toBe(assetMetadata);
        });

        it("Does not save asset JSON to the storage provider if asset has not been tagged", async () => {
            const assetMetadata: IAssetMetadata = {
                asset: {
                    ...testAssets[0],
                    state: AssetState.Visited,
                },
                regions: [],
            };

            const result = await assetService.save(assetMetadata);

            expect(storageProviderMock.writeText).not.toBeCalled();
            expect(result).toBe(assetMetadata);
        });

        it("getAssets encodes local file path", async () => {
            const testAsset = MockFactory.createTestAsset(" 11");
            testAssets.push(testAsset);

            const result = await assetService.getAssets();

            expect(result[10].path).toEqual("file:C:/Desktop/asset%2011.jpg");
        });
    });

    describe("Assets Protocol Tests", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const testAssets = MockFactory.createMixProtocolTestAssets();
        let assetService: AssetService = null;
        let assetProviderMock: IAssetProvider = null;
        let storageProviderMock: any = null;

        beforeEach(() => {
            assetProviderMock = {
                getAssets: () => Promise.resolve(testAssets),
            };

            storageProviderMock = {
                readText: jest.fn((filePath) => {
                    const assetMetadata: IAssetMetadata = {
                        asset: testAssets[0],
                        regions: [],
                    };

                    return JSON.stringify(assetMetadata, null, 4);
                }),
                writeText: jest.fn((filePath, contents) => true),
            };

            AssetProviderFactory.create = jest.fn(() => assetProviderMock);
            StorageProviderFactory.create = jest.fn(() => storageProviderMock);

            assetService = new AssetService(testProject);
        });

        it("Check file protocol", async () => {
            const assets = await assetService.getAssets();

            expect(assets.length).toEqual(2);
            expect(assets[0].path).toEqual("file:C:/Desktop/asset0.jpg");
            expect(assets[1].path).toEqual("https://image.com/asset1.jpg");
        });
    });

    describe("TFRecords Methods", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const testAsset = MockFactory.createTestAsset("tfrecord",
                                                      AssetState.NotVisited,
                                                      "C:\\Desktop\\asset.tfrecord",
                                                      AssetType.TFRecord);
        let assetService: AssetService = null;
        let assetProviderMock: IAssetProvider = null;
        let storageProviderMock: any = null;
        let tfrecords: Buffer;

        beforeEach(() => {
            assetProviderMock = {
                getAssets: () => Promise.resolve([testAsset]),
            };

            storageProviderMock = {
                readText: jest.fn((filePath) => {
                    return new Error("File not found");
                }),
                writeText: jest.fn((filePath, contents) => true),
            };

            AssetProviderFactory.create = jest.fn(() => assetProviderMock);
            StorageProviderFactory.create = jest.fn(() => storageProviderMock);

            assetService = new AssetService(testProject);

            let builder: TFRecordsBuilder;
            builder = new TFRecordsBuilder();

            builder.addArrayFeature("image/object/bbox/xmin", FeatureType.Float, [1.0, 1.0]);
            builder.addArrayFeature("image/object/bbox/ymin", FeatureType.Float, [2.0, 2.0]);
            builder.addArrayFeature("image/object/bbox/xmax", FeatureType.Float, [3.0, 3.0]);
            builder.addArrayFeature("image/object/bbox/ymax", FeatureType.Float, [4.0, 4.0]);
            builder.addArrayFeature("image/object/class/text", FeatureType.String, ["a", "b"]);

            const buffer = builder.build();
            tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);
        });

        HtmlFileReader.getAssetArray = jest.fn((asset) => {
            return Promise.resolve<Uint8Array>(new Uint8Array(tfrecords));
        });

        it("Loads the asset metadata from the tfrecord file", async () => {
            const result = await assetService.getAssetMetadata(testAsset);

            expect(result).not.toBeNull();
            expect(result.asset).toEqual(testAsset);
        });
    });
});
