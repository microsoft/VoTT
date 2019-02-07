import _ from "lodash";
import { VottJsonExportProvider, IVottJsonExportOptions } from "./vottJson";
import registerProviders from "../../registerProviders";
import { ExportAssetState } from "./exportProvider";
import { ExportProviderFactory } from "./exportProviderFactory";
import { IProject, IAssetMetadata, AssetState } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import { constants } from "../../common/constants";

describe("VoTT Json Export Provider", () => {
    const testProject: IProject = {
        ...MockFactory.createTestProject(),
        assets: {
            "asset-1": MockFactory.createTestAsset("1", AssetState.Tagged),
            "asset-2": MockFactory.createTestAsset("2", AssetState.Tagged),
            "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
            "asset-4": MockFactory.createTestAsset("4", AssetState.NotVisited),
        },
        exportFormat: {
            providerType: "json",
            providerOptions: {
                assetState: ExportAssetState.All,
            },
        },
    };

    const expectedFileName = testProject.name.replace(" ", "-") + constants.exportFileExtension;

    beforeEach(() => {
        registerProviders();
    });

    it("Is defined", () => {
        expect(VottJsonExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const options: IVottJsonExportOptions = {
            assetState: ExportAssetState.All,
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
                };

                return Promise.resolve(assetMetadata);
            });

            const storageProviderMock = LocalFileSystemProxy as jest.Mock<LocalFileSystemProxy>;
            storageProviderMock.mockClear();
        });

        it("Exports all assets", async () => {
            const options: IVottJsonExportOptions = {
                assetState: ExportAssetState.All,
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
                .toBeCalledWith(expectedFileName, expect.any(String));
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: IVottJsonExportOptions = {
                assetState: ExportAssetState.Visited,
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
                .toBeCalledWith(expectedFileName, expect.any(String));
        });

        it("Exports only tagged assets", async () => {
            const options: IVottJsonExportOptions = {
                assetState: ExportAssetState.Tagged,
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
                .toBeCalledWith(expectedFileName, expect.any(String));
        });
    });
});
