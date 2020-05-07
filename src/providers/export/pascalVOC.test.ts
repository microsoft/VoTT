import _ from "lodash";
import { PascalVOCExportProvider, IPascalVOCExportProviderOptions } from "./pascalVOC";
import { ExportAssetState } from "./exportProvider";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import {
    IAssetMetadata, AssetState, IRegion,
    RegionType, IPoint, IExportProviderOptions,
} from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import registerMixins from "../../registerMixins";
import HtmlFileReader from "../../common/htmlFileReader";
import { appInfo } from "../../common/appInfo";
import { AssetProviderFactory } from "../storage/assetProviderFactory";

registerMixins();

describe("PascalVOC Json Export Provider", () => {
    const testAssets = MockFactory.createTestAssets(10, 1);
    const baseTestProject = MockFactory.createTestProject("Test Project");
    baseTestProject.assets = {
        "asset-1": MockFactory.createTestAsset("1", AssetState.Tagged),
        "asset-2": MockFactory.createTestAsset("2", AssetState.Tagged),
        "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
    };
    baseTestProject.sourceConnection = MockFactory.createTestConnection("test", "localFileSystemProxy");
    baseTestProject.targetConnection = MockFactory.createTestConnection("test", "localFileSystemProxy");

    const tagLengthInPbtxt = 31;

    HtmlFileReader.getAssetArray = jest.fn(() => {
        return Promise.resolve(new Uint8Array([1, 2, 3]).buffer);
    });

    beforeAll(() => {
        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });
    });

    beforeEach(() => {
        registerProviders();
    });

    it("Is defined", () => {
        expect(PascalVOCExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const options: IPascalVOCExportProviderOptions = {
            assetState: ExportAssetState.All,
            exportUnassigned: true,
            testTrainSplit: 80,
        };
        const exportProvider = ExportProviderFactory.create("pascalVOC", baseTestProject, options);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(PascalVOCExportProvider);
    });

    describe("Export variations", () => {
        beforeEach(() => {
            const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
            assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
                const mockTag1 = MockFactory.createTestTag("1");
                const mockTag2 = MockFactory.createTestTag("2");
                const mockTag = Number(asset.id.split("-")[1]) > 7 ? mockTag1 : mockTag2;
                const mockRegion1 = MockFactory.createTestRegion("region-1", [mockTag.name]);
                const mockRegion2 = MockFactory.createTestRegion("region-2", [mockTag.name]);

                const assetMetadata: IAssetMetadata = {
                    asset,
                    regions: [mockRegion1, mockRegion2],
                    version: appInfo.version,
                };

                return Promise.resolve(assetMetadata);
            });

            const storageProviderMock = LocalFileSystemProxy as jest.Mock<LocalFileSystemProxy>;
            storageProviderMock.mockClear();
        });

        it("Exports all assets", async () => {
            const options: IPascalVOCExportProviderOptions = {
                assetState: ExportAssetState.All,
                exportUnassigned: true,
                testTrainSplit: 80,
            };

            const testProject = { ...baseTestProject };
            testProject.tags = MockFactory.createTestTags(3);

            const exportProvider = new PascalVOCExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;

            expect(createContainerCalls.length).toEqual(5);
            expect(createContainerCalls[1][0].endsWith("/JPEGImages")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/ImageSets")).toEqual(true);
            expect(createContainerCalls[4][0].endsWith("/ImageSets/Main")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(testAssets.length);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1.jpg")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2.jpg")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("/JPEGImages/Asset 3.jpg")).toEqual(true);
            expect(writeBinaryCalls[3][0].endsWith("/JPEGImages/Asset 4.jpg")).toEqual(true);

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls as any[];
            // We write an annotation XML file per asset, 2 files per tag + 1 label map file
            expect(writeTextFileCalls.length).toEqual(testAssets.length + (testProject.tags.length * 2) + 1);
            expect(writeTextFileCalls[0][0].endsWith("pascal_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));

            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 1.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 2.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 3.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 4.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 2_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_train.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_train.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 2_train.txt")))
                .toBeGreaterThanOrEqual(0);
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: IPascalVOCExportProviderOptions = {
                assetState: ExportAssetState.Visited,
                exportUnassigned: true,
                testTrainSplit: 80,
            };

            const testProject = { ...baseTestProject };
            testProject.tags = MockFactory.createTestTags(1);

            const exportProvider = new PascalVOCExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;

            expect(createContainerCalls.length).toEqual(5);
            expect(createContainerCalls[1][0].endsWith("/JPEGImages")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/ImageSets")).toEqual(true);
            expect(createContainerCalls[4][0].endsWith("/ImageSets/Main")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(3);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1.jpg")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2.jpg")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("/JPEGImages/Asset 3.jpg")).toEqual(true);

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls as any[];
            expect(writeTextFileCalls.length).toEqual(6);
            expect(writeTextFileCalls[0][0].endsWith("pascal_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));

            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 1.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 2.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 3.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_train.txt")))
                .toBeGreaterThanOrEqual(0);
        });

        it("Exports only tagged assets", async () => {
            const options: IPascalVOCExportProviderOptions = {
                assetState: ExportAssetState.Tagged,
                exportUnassigned: true,
                testTrainSplit: 80,
            };

            const testProject = { ...baseTestProject };
            testProject.tags = MockFactory.createTestTags(3);

            const exportProvider = new PascalVOCExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;

            expect(createContainerCalls.length).toEqual(5);
            expect(createContainerCalls[1][0].endsWith("/JPEGImages")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/ImageSets")).toEqual(true);
            expect(createContainerCalls[4][0].endsWith("/ImageSets/Main")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(2);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1.jpg")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2.jpg")).toEqual(true);

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls as any[];
            expect(writeTextFileCalls.length).toEqual(9);
            expect(writeTextFileCalls[0][0].endsWith("pascal_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));

            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 1.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 2.xml")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 2_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_train.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_train.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls.findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 2_train.txt")))
                .toBeGreaterThanOrEqual(0);
        });

        it("Export includes unassigned tags", async () => {
            const options: IPascalVOCExportProviderOptions = {
                assetState: ExportAssetState.Tagged,
                exportUnassigned: true,
                testTrainSplit: 80,
            };

            const testProject = { ...baseTestProject };
            const testAssets = MockFactory.createTestAssets(10, 0);
            testAssets.forEach((asset) => asset.state = AssetState.Tagged);
            testProject.assets = _.keyBy(testAssets, (asset) => asset.id);
            testProject.tags = MockFactory.createTestTags(3);

            const exportProvider = new PascalVOCExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls as any[];

            expect(writeTextFileCalls
                .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls
                .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_train.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls
                .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls
                .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_train.txt")))
                .toBeGreaterThanOrEqual(0);
        });

        it("Export does not include unassigned tags", async () => {
            const options: IPascalVOCExportProviderOptions = {
                assetState: ExportAssetState.Tagged,
                exportUnassigned: false,
                testTrainSplit: 80,
            };

            const testProject = { ...baseTestProject };
            const testAssets = MockFactory.createTestAssets(10, 0);
            testAssets.forEach((asset) => asset.state = AssetState.Tagged);
            testProject.assets = _.keyBy(testAssets, (asset) => asset.id);
            testProject.tags = MockFactory.createTestTags(3);

            const exportProvider = new PascalVOCExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls as any[];

            expect(writeTextFileCalls
                .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_val.txt")))
                .toEqual(-1);
            expect(writeTextFileCalls
                .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 0_train.txt")))
                .toEqual(-1);
            expect(writeTextFileCalls
                .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_val.txt")))
                .toBeGreaterThanOrEqual(0);
            expect(writeTextFileCalls
                .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_train.txt")))
                .toBeGreaterThanOrEqual(0);
        });

        describe("Annotations", () => {
            it("contains expected XML", async () => {
                const options: IPascalVOCExportProviderOptions = {
                    assetState: ExportAssetState.Tagged,
                    exportUnassigned: false,
                    testTrainSplit: 80,
                };

                const testProject = { ...baseTestProject };
                const testAssets = MockFactory.createTestAssets(10, 0);
                testAssets.forEach((asset) => asset.state = AssetState.Tagged);
                testProject.assets = _.keyBy(testAssets, (asset) => asset.id);
                testProject.tags = [MockFactory.createTestTag("1")];

                const exportProvider = new PascalVOCExportProvider(testProject, options);
                await exportProvider.export();

                const storageProviderMock = LocalFileSystemProxy as any;
                const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls as any[];
                const assetIndex = writeTextFileCalls.findIndex((args) => args[0].endsWith("/Annotations/Asset 1.xml"));
                const assetXml = writeTextFileCalls[assetIndex][1] as string;
                const objectRegExp = /<object>([\s\S]*?)<\/object>/g;
                const folderRegExp = new RegExp(/<filename>(.*?)<\/filename>/g);
                const pathRegExp = new RegExp(/<path>(.*?)<\/path>/g);
                const widthRegExp = new RegExp(/<width>(.*?)<\/width>/g);
                const heightRegExp = new RegExp(/<height>(.*?)<\/height>/g);
                const objectMatches = assetXml.match(objectRegExp);

                expect(objectMatches).toHaveLength(2);
                expect(folderRegExp.exec(assetXml)[1]).toEqual(testAssets[1].name);
                expect(pathRegExp.exec(assetXml)[1]).toContain(testAssets[1].name);
                expect(widthRegExp.exec(assetXml)[1]).toEqual(testAssets[1].size.width.toString());
                expect(heightRegExp.exec(assetXml)[1]).toEqual(testAssets[1].size.height.toString());
            });
        });

        describe("Test Train Splits", () => {
            async function testTestTrainSplit(testTrainSplit: number): Promise<void> {
                const options: IPascalVOCExportProviderOptions = {
                    assetState: ExportAssetState.Tagged,
                    exportUnassigned: true,
                    testTrainSplit,
                };

                const testProject = { ...baseTestProject };
                const testAssets = MockFactory.createTestAssets(13, 0);
                testAssets.forEach((asset) => asset.state = AssetState.Tagged);
                testProject.assets = _.keyBy(testAssets, (asset) => asset.id);
                testProject.tags = MockFactory.createTestTags(3);

                const exportProvider = new PascalVOCExportProvider(testProject, options);
                const getAssetsSpy = jest.spyOn(exportProvider, "getAssetsForExport");

                await exportProvider.export();

                const storageProviderMock = LocalFileSystemProxy as any;
                const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls as any[];

                const valDataIndex1 = writeTextFileCalls
                    .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_val.txt"));
                const trainDataIndex1 = writeTextFileCalls
                    .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 1_train.txt"));
                const valDataIndex2 = writeTextFileCalls
                    .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 2_val.txt"));
                const trainDataIndex2 = writeTextFileCalls
                    .findIndex((args) => args[0].endsWith("/ImageSets/Main/Tag 2_train.txt"));

                const assetsToExport = await getAssetsSpy.mock.results[0].value;
                const trainArray = [];
                const testArray = [];
                const tagsAssestList: {
                    [index: string]: {
                        assetSet: Set<string>,
                        testArray: string[],
                        trainArray: string[],
                    },
                } = {};
                testProject.tags.forEach((tag) =>
                    tagsAssestList[tag.name] = {
                        assetSet: new Set(), testArray: [],
                        trainArray: [],
                    });
                assetsToExport.forEach((assetMetadata) => {
                    assetMetadata.regions.forEach((region) => {
                        region.tags.forEach((tagName) => {
                            if (tagsAssestList[tagName]) {
                                tagsAssestList[tagName].assetSet.add(assetMetadata.asset.name);
                            }
                        });
                    });
                });

                for (const tagKey of Object.keys(tagsAssestList)) {
                    const assetSet = tagsAssestList[tagKey].assetSet;
                    const testCount = Math.ceil(((100 - testTrainSplit) / 100) * assetSet.size);
                    tagsAssestList[tagKey].testArray = Array.from(assetSet).slice(0, testCount);
                    tagsAssestList[tagKey].trainArray = Array.from(assetSet).slice(testCount, assetSet.size);
                    testArray.push(...tagsAssestList[tagKey].testArray);
                    trainArray.push(...tagsAssestList[tagKey].trainArray);
                }

                expect(writeTextFileCalls[valDataIndex1][1].split(/\r?\n/).filter((line) =>
                    line.endsWith(" 1"))).toHaveLength(tagsAssestList["Tag 1"].testArray.length);
                expect(writeTextFileCalls[trainDataIndex1][1].split(/\r?\n/).filter((line) =>
                    line.endsWith(" 1"))).toHaveLength(tagsAssestList["Tag 1"].trainArray.length);
                expect(writeTextFileCalls[valDataIndex2][1].split(/\r?\n/).filter((line) =>
                    line.endsWith(" 1"))).toHaveLength(tagsAssestList["Tag 2"].testArray.length);
                expect(writeTextFileCalls[trainDataIndex2][1].split(/\r?\n/).filter((line) =>
                    line.endsWith(" 1"))).toHaveLength(tagsAssestList["Tag 2"].trainArray.length);
            }

            it("Correctly generated files based on 50/50 test / train split", async () => {
                await testTestTrainSplit(50);
            });

            it("Correctly generated files based on 60/40 test / train split", async () => {
                await testTestTrainSplit(60);
            });

            it("Correctly generated files based on 80/20 test / train split", async () => {
                await testTestTrainSplit(80);
            });

            it("Correctly generated files based on 90/10 test / train split", async () => {
                await testTestTrainSplit(90);
            });
        });
    });
});
