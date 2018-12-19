import _ from "lodash";
import { TFPascalVOCJsonExportProvider,
         ITFPascalVOCJsonExportOptions,
         TFPascalVOCExportAssetState } from "./tensorFlowPascalVOC";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import { IProject, IAssetMetadata, AssetState } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

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
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: ITFPascalVOCJsonExportOptions = {
                assetState: TFPascalVOCExportAssetState.Visited,
            };

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportJson = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const exportObject = JSON.parse(exportJson);

            const exportedAssets = _.values(exportObject.assets);
            const expectedAssets = _.values(testProject.assets)
                .filter((asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged);

            expect(exportedAssets.length).toEqual(expectedAssets.length);
            expect(LocalFileSystemProxy.prototype.writeText)
                .toBeCalledWith("Test-Project-export.json", expect.any(String));
        });

        it("Exports only tagged assets", async () => {
            const options: ITFPascalVOCJsonExportOptions = {
                assetState: TFPascalVOCExportAssetState.Tagged,
            };

            const exportProvider = new TFPascalVOCJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportJson = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const exportObject = JSON.parse(exportJson);

            const exportedAssets = _.values(exportObject.assets);
            const expectedAssets = _.values(testProject.assets).filter((asset) => asset.state === AssetState.Tagged);

            expect(exportedAssets.length).toEqual(expectedAssets.length);
            expect(LocalFileSystemProxy.prototype.writeText)
                .toBeCalledWith("Test-Project-export.json", expect.any(String));
        });
    });
});
