import { AssetService } from "./assetService";
import { AssetType, IAssetMetadata, AssetState, IAsset, IProject } from "../models/applicationState";
import MockFactory from "../common/mockFactory";
import { AssetProviderFactory, IAssetProvider } from "../providers/storage/assetProviderFactory";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { constants } from "../common/constants";
import { TFRecordsBuilder, FeatureType } from "../providers/export/tensorFlowRecords/tensorFlowBuilder";
import HtmlFileReader from "../common/htmlFileReader";
import { encodeFileURI } from "../common/utils";
import _ from "lodash";
import registerMixins from "../registerMixins";

describe("Asset Service", () => {
    describe("Static Methods", () => {
        it("creates an asset from a file path", () => {
            const path = "C:\\dir1\\dir2\\asset1.jpg";
            const asset = AssetService.createAssetFromFilePath(path);

            expect(asset).not.toBeNull();
            expect(asset.id).toEqual(expect.any(String));
            expect(asset.name).toEqual("asset1.jpg");
            expect(asset.type).toEqual(AssetType.Image);
            expect(asset.path).toEqual(encodeFileURI(path));
            expect(asset.format).toEqual("jpg");
        });

        it("creates an asset from an encoded file", () => {
            const path = "C:\\dir1\\dir2\\asset%201.jpg";
            const asset = AssetService.createAssetFromFilePath(path);

            expect(asset).not.toBeNull();
            expect(asset.id).toEqual(expect.any(String));
            expect(asset.name).toEqual("asset%25201.jpg");
            expect(asset.type).toEqual(AssetType.Image);
            expect(asset.path).toEqual(encodeFileURI(path));
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

        it("detects a video asset by common file extension", () => {
            const path = "file:C:/dir1/dir2/asset1.mp4#t=5";
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

        it("detects an asset in case asset name contains other file extension in the middle", () => {
            const path = "C:\\dir1\\dir2\\asset1.docx.jpg";
            const asset = AssetService.createAssetFromFilePath(path);
            expect(asset.type).toEqual(AssetType.Image);
        });

        it("detects an asset in case asset name contains other file extension in the middle", () => {
            const path = "C:\\dir1\\dir2\\asset1.jpg.docx";
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
                        version: "",
                    };

                    return JSON.stringify(assetMetadata, null, 4);
                }),
                writeText: jest.fn(() => Promise.resolve()),
                deleteFile: jest.fn(() => Promise.resolve()),
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
                version: "",
            };

            const result = await assetService.save(assetMetadata);

            expect(storageProviderMock.writeText).toBeCalledWith(
                `${assetMetadata.asset.id}${constants.assetMetadataFileExtension}`,
                JSON.stringify(assetMetadata, null, 4),
            );
            expect(result).toBe(assetMetadata);
        });

        it("Deletes asset JSON from the storage provider if asset has not been tagged", async () => {
            const assetMetadata: IAssetMetadata = {
                asset: {
                    ...testAssets[0],
                    state: AssetState.Visited,
                },
                regions: [],
                version: "",
            };

            const result = await assetService.save(assetMetadata);

            expect(storageProviderMock.writeText).not.toBeCalled();
            expect(storageProviderMock.deleteFile).toBeCalled();
            expect(result).toBe(assetMetadata);
        });

        it("getAssets encodes local file path", async () => {
            const testAsset = MockFactory.createTestAsset(" 11");
            testAssets.push(testAsset);

            const result = await assetService.getAssets();
            const expected = encodeFileURI("C:\\Desktop\\asset 11.jpg");

            expect(result[10].path).toEqual(expected);
        });

        it("Test encoding special characters # and ?", async () => {
            const testAsset = MockFactory.createTestAsset("#test?");
            testAssets.push(testAsset);

            const result = await assetService.getAssets();
            const expected = encodeFileURI("C:\\Desktop\\asset#test?.jpg");

            expect(result[11].path).toEqual(expected);
        });

        it("Test encoding special characters # and ? and other chars not to be encoded", async () => {
            const testAsset = MockFactory.createTestAsset("~!@#$&*()=:,;?+'");
            testAssets.push(testAsset);

            const result = await assetService.getAssets();
            const expected = encodeFileURI("C:\\Desktop\\asset~!@#$&*()=:,;?+'.jpg");

            expect(result[12].path).toEqual(expected);
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
                        version: "",
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

            builder.addFeature("image/width", FeatureType.Int64, 600);
            builder.addFeature("image/height", FeatureType.Int64, 800);

            builder.addArrayFeature("image/object/bbox/xmin", FeatureType.Float, [0.0, 0.1]);
            builder.addArrayFeature("image/object/bbox/ymin", FeatureType.Float, [0.0, 0.1]);
            builder.addArrayFeature("image/object/bbox/xmax", FeatureType.Float, [0.5, 1.0]);
            builder.addArrayFeature("image/object/bbox/ymax", FeatureType.Float, [0.5, 1.0]);
            builder.addArrayFeature("image/object/class/text", FeatureType.String, ["a", "b"]);

            const buffer = builder.build();
            tfrecords = TFRecordsBuilder.buildTFRecords([buffer]);
        });

        HtmlFileReader.getAssetArray = jest.fn((asset) => {
            return Promise.resolve<ArrayBuffer>(new Uint8Array(tfrecords).buffer);
        });

        it("Loads the asset metadata from the tfrecord file", async () => {
            const result = await assetService.getAssetMetadata(testAsset);

            expect(result).not.toBeNull();
            expect(result.asset).toEqual(testAsset);

            expect(result.regions.length).toEqual(2);
            expect(result.regions[0].tags.length).toEqual(1);
            expect(result.regions[0].tags[0]).toEqual("a");
            expect(result.regions[0].points.length).toEqual(2);
            expect(result.regions[0].points[0].x).toEqual(0);
            expect(result.regions[0].points[0].y).toEqual(0);
            expect(result.regions[0].points[1].x).toEqual(300);
            expect(result.regions[0].points[1].y).toEqual(400);
            expect(result.regions[1].tags.length).toEqual(1);
            expect(result.regions[1].tags[0]).toEqual("b");
            expect(result.regions[1].points.length).toEqual(2);
            expect(Math.floor(result.regions[1].points[0].x)).toEqual(60);
            expect(Math.floor(result.regions[1].points[0].y)).toEqual(80);
            expect(Math.floor(result.regions[1].points[1].x)).toEqual(600);
            expect(Math.floor(result.regions[1].points[1].y)).toEqual(800);
        });
    });

    describe("Tag Update functions", () => {

        function populateProjectAssets(project?: IProject, assetCount = 10) {
            if (!project) {
                project = MockFactory.createTestProject();
            }
            const assets = MockFactory.createTestAssets(assetCount);
            assets.forEach((asset) => {
                asset.state = AssetState.Tagged;
            });

            project.assets = _.keyBy(assets, (asset) => asset.id);
            return project;
        }

        beforeAll(() => {
            registerMixins();
        });

        it("Deletes tag from assets", async () => {
            const tag1 = "tag1";
            const tag2 = "tag2";
            const region = MockFactory.createTestRegion(undefined, [tag1, tag2]);
            const asset: IAsset = {
                ...MockFactory.createTestAsset("1"),
                state: AssetState.Tagged,
            };
            const assetMetadata = MockFactory.createTestAssetMetadata(asset, [region]);
            AssetService.prototype.getAssetMetadata = jest.fn((asset: IAsset) => Promise.resolve(assetMetadata));

            const expectedAssetMetadata: IAssetMetadata = {
                ...MockFactory.createTestAssetMetadata(
                    asset,
                    [
                        {
                            ...region,
                            tags: [tag2],
                        },
                    ],
                ),
            };

            const project = populateProjectAssets();
            const assetService = new AssetService(project);
            const assetUpdates = await assetService.deleteTag(tag1);

            expect(assetUpdates).toHaveLength(1);
            expect(assetUpdates[0]).toEqual(expectedAssetMetadata);
        });

        it("Deletes empty regions after deleting only tag from region", async () => {
            const tag1 = "tag1";
            const region = MockFactory.createTestRegion(undefined, [tag1]);
            const asset: IAsset = {
                ...MockFactory.createTestAsset("1"),
                state: AssetState.Tagged,
            };
            const assetMetadata = MockFactory.createTestAssetMetadata(asset, [region]);
            AssetService.prototype.getAssetMetadata = jest.fn((asset: IAsset) => Promise.resolve(assetMetadata));

            const expectedAssetMetadata: IAssetMetadata = MockFactory.createTestAssetMetadata(asset, []);
            const project = populateProjectAssets();
            const assetService = new AssetService(project);
            const assetUpdates = await assetService.deleteTag(tag1);

            expect(assetUpdates).toHaveLength(1);
            expect(assetUpdates[0]).toEqual(expectedAssetMetadata);
        });

        it("Updates renamed tag within all assets", async () => {
            const tag1 = "tag1";
            const newTag = "tag2";
            const region = MockFactory.createTestRegion(undefined, [tag1]);
            const asset: IAsset = {
                ...MockFactory.createTestAsset("1"),
                state: AssetState.Tagged,
            };
            const assetMetadata = MockFactory.createTestAssetMetadata(asset, [region]);
            AssetService.prototype.getAssetMetadata = jest.fn((asset: IAsset) => Promise.resolve(assetMetadata));

            const expectedAssetMetadata: IAssetMetadata = {
                ...MockFactory.createTestAssetMetadata(
                    asset,
                    [
                        {
                            ...region,
                            tags: [newTag],
                        },
                    ],
                ),
            };

            const project = populateProjectAssets();
            const assetService = new AssetService(project);
            const assetUpdates = await assetService.renameTag(tag1, newTag);

            expect(assetUpdates).toHaveLength(1);
            expect(assetUpdates[0]).toEqual(expectedAssetMetadata);
        });
    });
});
