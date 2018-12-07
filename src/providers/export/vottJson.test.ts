import _ from "lodash";
import { VottJsonExportProvider, IVottJsonExportOptions } from "./vottJson";
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
        assets: createTestAssets(10),
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

    const options: IVottJsonExportOptions = {
        assetState: "all",
    };

    beforeEach(() => {
        registerProviders();
    });

    it("Is defined", () => {
        expect(VottJsonExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const exportProvider = ExportProviderFactory.create("vottJson", testProject, options);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(VottJsonExportProvider);
    });

    it("Exports a vott project into a single JSON file", async () => {
        const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata: IAssetMetadata = {
                asset,
                regions: [],
                timestamp: null,
            };

            return Promise.resolve(assetMetadata);
        });

        const exportProvider = new VottJsonExportProvider(testProject, options);
        await exportProvider.export();

        const storageProviderMock = LocalFileSystemProxy as any;
        const exportJson = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
        const exportObject = JSON.parse(exportJson);

        expect(Object.keys(exportObject.assets).length).toEqual(Object.keys(testProject.assets).length);
        expect(LocalFileSystemProxy.prototype.writeText).toBeCalledWith("Test-Project-export.json", expect.any(String));
    });
});

function createTestAssets(count: number): { [index: string]: IAsset } {
    const assets: IAsset[] = [];
    for (let i = 1; i <= count; i++) {
        assets.push({
            id: `asset-${i}`,
            format: "jpg",
            name: `Asset ${i}`,
            path: `C:\\Desktop\\asset${i}.jpg`,
            state: AssetState.NotVisited,
            type: AssetType.Image,
            size: {
                width: 800,
                height: 600,
            },
        });
    }

    return _.keyBy(assets, (asset) => asset.id);
}
