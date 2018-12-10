import _ from "lodash";
import { VottJsonExportProvider, IVottJsonExportOptions, VottExportAssetState } from "./vottJson";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import { IProject, IAssetMetadata, IAsset, AssetType, AssetState } from "../../models/applicationState";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";

describe("VoTT Json Export Provider", () => {
    const testProject: IProject = {
        id: "1",
        name: "Test Project",
        autoSave: true,
        assets: {
            "asset-1": createTestAsset("1", AssetState.Tagged),
            "asset-2": createTestAsset("2", AssetState.Tagged),
            "asset-3": createTestAsset("3", AssetState.Visited),
            "asset-4": createTestAsset("4", AssetState.NotVisited),
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
        expect(VottJsonExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const options: IVottJsonExportOptions = {
            assetState: VottExportAssetState.All,
        };
        const exportProvider = ExportProviderFactory.create("vottJson", testProject, options);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(VottJsonExportProvider);
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
            const options: IVottJsonExportOptions = {
                assetState: VottExportAssetState.All,
            };

            const exportProvider = new VottJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportJson = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const exportObject = JSON.parse(exportJson);

            const exportedAssets = _.values(exportObject.assets);
            const expectedAssets = _.values(testProject.assets);

            expect(exportedAssets.length).toEqual(expectedAssets.length);
            expect(LocalFileSystemProxy.prototype.writeText)
                .toBeCalledWith("Test-Project-export.json", expect.any(String));
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: IVottJsonExportOptions = {
                assetState: VottExportAssetState.Visited,
            };

            const exportProvider = new VottJsonExportProvider(testProject, options);
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
            const options: IVottJsonExportOptions = {
                assetState: VottExportAssetState.Tagged,
            };

            const exportProvider = new VottJsonExportProvider(testProject, options);
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

function createTestAsset(name: string, assetState: AssetState = AssetState.NotVisited): IAsset {
    return {
        id: `asset-${name}`,
        format: "jpg",
        name: `Asset ${name}`,
        path: `C:\\Desktop\\asset${name}.jpg`,
        state: assetState,
        type: AssetType.Image,
        size: {
            width: 800,
            height: 600,
        },
    };
}

function createTestAssets(count: number): { [index: string]: IAsset } {
    const assets: IAsset[] = [];
    for (let i = 1; i <= count; i++) {
        assets.push(createTestAsset(i.toString()));
    }

    return _.keyBy(assets, (asset) => asset.id);
}
