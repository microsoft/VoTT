import _ from "lodash";
import { TFPascalVOCJsonExportProvider,
         ITFPascalVOCJsonExportOptions } from "./tensorFlowPascalVOC";
import { ExportAssetState } from "./exportProvider";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import { IProject, IAssetMetadata, AssetState } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
import axios from "axios";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";

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

    const tagLengthInPbtxt = 37;

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
                const assetMetadata: IAssetMetadata = {
                    asset,
                    regions: [],
                    timestamp: null,
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

            expect(createContainerCalls.length).toEqual(4);
            expect(createContainerCalls[1][0].endsWith("/JPEGImages")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/ImageSets")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(4);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("/JPEGImages/Asset 3")).toEqual(true);
            expect(writeBinaryCalls[3][0].endsWith("/JPEGImages/Asset 4")).toEqual(true);

            const writeFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeFileCalls.length).toEqual(1);
            const exportPbtxt = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            expect(exportPbtxt.length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length) + testProject.tags.length - 1);
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

            expect(createContainerCalls.length).toEqual(4);
            expect(createContainerCalls[1][0].endsWith("/JPEGImages")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/ImageSets")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(3);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("/JPEGImages/Asset 3")).toEqual(true);

            const writeFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeFileCalls.length).toEqual(1);
            const exportPbtxt = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            expect(exportPbtxt.length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length) + testProject.tags.length - 1);
        });

        it("Exports only tagged assets", async () => {
            const options: ITFPascalVOCJsonExportOptions = {
                assetState: ExportAssetState.Tagged,
            };

            const testProject = {...baseTestProject};
            testProject.tags = MockFactory.createTestTags(0);

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;

            expect(createContainerCalls.length).toEqual(4);
            expect(createContainerCalls[1][0].endsWith("/JPEGImages")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/ImageSets")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(2);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2")).toEqual(true);

            const writeFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeFileCalls.length).toEqual(0);
        });
    });
});
