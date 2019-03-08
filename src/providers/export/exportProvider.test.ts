import { ExportProvider, ExportAssetState } from "./exportProvider";
import { IProject, AssetState, AssetType, IExportProviderOptions, IAsset } from "../../models/applicationState";
import { ExportProviderFactory } from "./exportProviderFactory";
import MockFactory from "../../common/mockFactory";
import registerProviders from "../../registerProviders";
import _ from "lodash";
import registerMixins from "../../registerMixins";
import { AssetProviderFactory } from "../storage/assetProviderFactory";
import { AssetService } from "../../services/assetService";

registerMixins();

describe("Export Provider Base", () => {
    let testProject: IProject = null;
    const testAssets = MockFactory.createTestAssets(10, 1);

    beforeAll(() => {
        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });

        AssetService.prototype.getAssetMetadata = jest.fn((asset: IAsset) => {
            return {
                asset: { ...asset },
                regions: [],
            };
        });

        testProject = {
            ...MockFactory.createTestProject("TestProject"),
            assets: {
                "asset-1": MockFactory.createTestAsset("1", AssetState.Tagged),
                "asset-2": MockFactory.createTestAsset("2", AssetState.Tagged),
                "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
                "asset-4": MockFactory.createTestAsset("4", AssetState.NotVisited),
            },
        };
    });

    it("initializes the asset and storage providers", () => {
        registerProviders();

        ExportProviderFactory.register({
            name: "test",
            displayName: "Test DisplayName",
            factory: (project) => new TestExportProvider(project),
        });
        const exportProvider = ExportProviderFactory.create("test", testProject) as TestExportProvider;
        const assetProvider = exportProvider.getAssetProvider();
        const storageProvider = exportProvider.getStorageProvider();

        expect(assetProvider).not.toBeNull();
        expect(storageProvider).not.toBeNull();
    });

    it("Exports all frames", async () => {
        registerProviders();

        ExportProviderFactory.register({
            name: "test",
            displayName: "Test DisplayName",
            factory: (project) => new TestExportProvider(project, { assetState: ExportAssetState.All }),
        });

        const exportProvider = ExportProviderFactory.create("test", testProject) as TestExportProvider;
        const assetsToExport = await exportProvider.getAssetsForExport();
        expect(assetsToExport.length).toEqual(testAssets.length);
    });

    it("Exports visited frames", async () => {
        registerProviders();

        ExportProviderFactory.register({
            name: "test",
            displayName: "Test DisplayName",
            factory: (project) => new TestExportProvider(project, { assetState: ExportAssetState.Visited }),
        });

        const exportProvider = ExportProviderFactory.create("test", testProject) as TestExportProvider;
        const assetsToExport = await exportProvider.getAssetsForExport();
        const visitedAssets = _
            .values(testProject.assets)
            .filter((asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged);
        expect(assetsToExport.length).toEqual(visitedAssets.length);
    });

    it("Exports tagged frames", async () => {
        registerProviders();

        ExportProviderFactory.register({
            name: "test",
            displayName: "Test DisplayName",
            factory: (project) => new TestExportProvider(project, { assetState: ExportAssetState.Tagged }),
        });

        const exportProvider = ExportProviderFactory.create("test", testProject) as TestExportProvider;
        const assetsToExport = await exportProvider.getAssetsForExport();
        const taggedAssets = _
            .values(testProject.assets)
            .filter((asset) => asset.state === AssetState.Tagged);
        expect(assetsToExport.length).toEqual(taggedAssets.length);
    });
});

class TestExportProvider extends ExportProvider {
    public export(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public getAssetProvider() {
        return this.assetProvider;
    }

    public getStorageProvider() {
        return this.storageProvider;
    }
}
