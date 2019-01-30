import _ from "lodash";
import { TFPascalVOCJsonExportProvider,
         ITFPascalVOCJsonExportOptions } from "./tensorFlowPascalVOC";
import { ExportAssetState } from "./exportProvider";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import { IProject, IAssetMetadata, AssetState, IRegion, RegionType,
         ITagMetadata, IPoint } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
import axios from "axios";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";

function _base64ToArrayBuffer(base64: string) {
    const binaryString =  window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array( len );
    for (let i = 0; i < len; i++)        {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

describe("TFPascalVOC Json Export Provider", () => {
    const baseTestProject = MockFactory.createTestProject("Test Project");
    baseTestProject.assets = {
        "asset-1": MockFactory.createTestAsset("1", AssetState.Tagged),
        "asset-2": MockFactory.createTestAsset("2", AssetState.Tagged),
        "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
        "asset-4": MockFactory.createTestAsset("4", AssetState.NotVisited),
    };
    baseTestProject.sourceConnection = MockFactory.createTestConnection("test", "localFileSystemProxy");
    baseTestProject.targetConnection = MockFactory.createTestConnection("test", "localFileSystemProxy");

    const tagLengthInPbtxt = 31;

    axios.get = jest.fn(() => {
        return Promise.resolve({
            data: [1, 2, 3],
        });
    });

    beforeEach(() => {
        registerProviders();
    });

    it("Is defined", () => {
        expect(TFPascalVOCJsonExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const options: ITFPascalVOCJsonExportOptions = {
            assetState: ExportAssetState.All,
        };
        const exportProvider = ExportProviderFactory.create("tensorFlowPascalVOC", baseTestProject, options);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(TFPascalVOCJsonExportProvider);
    });

    describe("Export variations", () => {
        beforeEach(() => {
            const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
            assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
                const mockTag: ITagMetadata = {
                    name: "Tag 1",
                    properties: null,
                };

                const mockStartPoint: IPoint = {
                    x: 1,
                    y: 2,
                };

                const mockEndPoint: IPoint = {
                    x: 3,
                    y: 4,
                };

                const mockRegion: IRegion = {
                    id: "id",
                    type: RegionType.Rectangle,
                    tags: [mockTag],
                    points: [mockStartPoint, mockEndPoint],
                };

                const assetMetadata: IAssetMetadata = {
                    asset,
                    regions: [mockRegion],
                };

                return Promise.resolve(assetMetadata);
            });

            const storageProviderMock = LocalFileSystemProxy as jest.Mock<LocalFileSystemProxy>;
            storageProviderMock.mockClear();
        });

        it("Exports all assets", async () => {
            const options: ITFPascalVOCJsonExportOptions = {
                assetState: ExportAssetState.All,
            };

            const testProject = {...baseTestProject};
            testProject.tags = MockFactory.createTestTags(3);

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;

            expect(createContainerCalls.length).toEqual(5);
            expect(createContainerCalls[1][0].endsWith("/JPEGImages")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/ImageSets")).toEqual(true);
            expect(createContainerCalls[4][0].endsWith("/ImageSets/Main")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(4);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1.jpg")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2.jpg")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("/JPEGImages/Asset 3.jpg")).toEqual(true);
            expect(writeBinaryCalls[3][0].endsWith("/JPEGImages/Asset 4.jpg")).toEqual(true);

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeTextFileCalls.length).toEqual(11);
            expect(writeTextFileCalls[0][0].endsWith("pascal_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));
            expect(writeTextFileCalls[1][0].endsWith("/Annotations/Asset 1.xml")).toEqual(true);
            expect(writeTextFileCalls[2][0].endsWith("/Annotations/Asset 2.xml")).toEqual(true);
            expect(writeTextFileCalls[3][0].endsWith("/Annotations/Asset 3.xml")).toEqual(true);
            expect(writeTextFileCalls[4][0].endsWith("/Annotations/Asset 4.xml")).toEqual(true);
            expect(writeTextFileCalls[5][0].endsWith("/ImageSets/Main/Tag 0_val.txt")).toEqual(true);
            expect(writeTextFileCalls[6][0].endsWith("/ImageSets/Main/Tag 1_val.txt")).toEqual(true);
            expect(writeTextFileCalls[7][0].endsWith("/ImageSets/Main/Tag 2_val.txt")).toEqual(true);
            expect(writeTextFileCalls[8][0].endsWith("/ImageSets/Main/Tag 0_train.txt")).toEqual(true);
            expect(writeTextFileCalls[9][0].endsWith("/ImageSets/Main/Tag 1_train.txt")).toEqual(true);
            expect(writeTextFileCalls[10][0].endsWith("/ImageSets/Main/Tag 2_train.txt")).toEqual(true);
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: ITFPascalVOCJsonExportOptions = {
                assetState: ExportAssetState.Visited,
            };

            const testProject = {...baseTestProject};
            testProject.tags = MockFactory.createTestTags(1);

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
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

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeTextFileCalls.length).toEqual(6);
            expect(writeTextFileCalls[0][0].endsWith("pascal_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));
            expect(writeTextFileCalls[1][0].endsWith("/Annotations/Asset 1.xml")).toEqual(true);
            expect(writeTextFileCalls[2][0].endsWith("/Annotations/Asset 2.xml")).toEqual(true);
            expect(writeTextFileCalls[3][0].endsWith("/Annotations/Asset 3.xml")).toEqual(true);
            expect(writeTextFileCalls[4][0].endsWith("/ImageSets/Main/Tag 0_val.txt")).toEqual(true);
            expect(writeTextFileCalls[5][0].endsWith("/ImageSets/Main/Tag 0_train.txt")).toEqual(true);
        });

        it("Exports only tagged assets", async () => {
            const options: ITFPascalVOCJsonExportOptions = {
                assetState: ExportAssetState.Tagged,
            };

            const testProject = {...baseTestProject};
            testProject.tags = MockFactory.createTestTags(3);

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
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

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeTextFileCalls.length).toEqual(9);
            expect(writeTextFileCalls[0][0].endsWith("pascal_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));
            expect(writeTextFileCalls[1][0].endsWith("/Annotations/Asset 1.xml")).toEqual(true);
            expect(writeTextFileCalls[2][0].endsWith("/Annotations/Asset 2.xml")).toEqual(true);
            expect(writeTextFileCalls[3][0].endsWith("/ImageSets/Main/Tag 0_val.txt")).toEqual(true);
            expect(writeTextFileCalls[4][0].endsWith("/ImageSets/Main/Tag 1_val.txt")).toEqual(true);
            expect(writeTextFileCalls[5][0].endsWith("/ImageSets/Main/Tag 2_val.txt")).toEqual(true);
            expect(writeTextFileCalls[6][0].endsWith("/ImageSets/Main/Tag 0_train.txt")).toEqual(true);
            expect(writeTextFileCalls[7][0].endsWith("/ImageSets/Main/Tag 1_train.txt")).toEqual(true);
            expect(writeTextFileCalls[8][0].endsWith("/ImageSets/Main/Tag 2_train.txt")).toEqual(true);
        });
    });
});
