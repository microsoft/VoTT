import _ from "lodash";
import { TFPascalVOCJsonExportProvider,
         ITFPascalVOCJsonExportOptions,
         TFPascalVOCExportAssetState } from "./tensorFlowPascalVOC";
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
    const testProject: IProject = {
        id: "1",
        name: "Test Project",
        autoSave: true,
        assets: {
            "asset-1": MockFactory.createTestAsset("1", AssetState.Tagged),
            "asset-2": MockFactory.createTestAsset("2", AssetState.Tagged),
            "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
            "asset-4": MockFactory.createTestAsset("4", AssetState.NotVisited),
        },
        exportFormat: {
            providerType: "json",
            providerOptions: {},
        },
        sourceConnection: {
            id: "local-1",
            name: "Local Files 1",
            providerType: "localFileSystemProxy",
            providerOptions: {},
        },
        targetConnection: {
            id: "local-1",
            name: "Local Files 1",
            providerType: "localFileSystemProxy",
            providerOptions: {},
        },
        tags: [],
    };

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
            assetState: TFPascalVOCExportAssetState.All,
        };
        const exportProvider = ExportProviderFactory.create("tensorFlowPascalVOC", testProject, options);
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
                assetState: TFPascalVOCExportAssetState.All,
            };

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;

            expect(createContainerCalls.length).toEqual(4);
            expect(createContainerCalls[1][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/ImageSets")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/JPEGImages")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(4);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("/JPEGImages/Asset 3")).toEqual(true);
            expect(writeBinaryCalls[3][0].endsWith("/JPEGImages/Asset 4")).toEqual(true);
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: ITFPascalVOCJsonExportOptions = {
                assetState: TFPascalVOCExportAssetState.Visited,
            };

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;

            expect(createContainerCalls.length).toEqual(4);
            expect(createContainerCalls[1][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/ImageSets")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/JPEGImages")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(3);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("/JPEGImages/Asset 3")).toEqual(true);
        });

        it("Exports only tagged assets", async () => {
            const options: ITFPascalVOCJsonExportOptions = {
                assetState: TFPascalVOCExportAssetState.Tagged,
            };

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;

            expect(createContainerCalls.length).toEqual(4);
            expect(createContainerCalls[1][0].endsWith("/Annotations")).toEqual(true);
            expect(createContainerCalls[2][0].endsWith("/ImageSets")).toEqual(true);
            expect(createContainerCalls[3][0].endsWith("/JPEGImages")).toEqual(true);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(2);
            expect(writeBinaryCalls[0][0].endsWith("/JPEGImages/Asset 1")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("/JPEGImages/Asset 2")).toEqual(true);
        });
    });
});
