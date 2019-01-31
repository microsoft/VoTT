import { AssetService } from "./assetService";
import { AssetType, IAssetMetadata } from "../models/applicationState";
import MockFactory from "../common/mockFactory";
import { AssetProviderFactory, IAssetProvider } from "../providers/storage/assetProviderFactory";
import { StorageProviderFactory, IStorageProvider } from "../providers/storage/storageProviderFactory";
import { constants } from "../common/constants";

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
                        timestamp: null,
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
                asset: testAssets[0],
                regions: [],
                timestamp: null,
            };

            const result = await assetService.save(assetMetadata);

            expect(storageProviderMock.writeText).toBeCalledWith(
                `${assetMetadata.asset.id}${constants.assetMetadataFileExtension}`,
                JSON.stringify(assetMetadata, null, 4),
            );
            expect(result).toBe(assetMetadata);
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
                        timestamp: null,
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
            expect(assets[0].path).toEqual("file:C:\\Desktop\\asset0.jpg");
            expect(assets[1].path).toEqual("https://image.com/asset1.jpg");
        });

    });
});
