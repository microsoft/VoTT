import { JsonExportProvider } from "./jsonExportProvider";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import { IProject, IAssetMetadata, IAsset, AssetType, AssetState } from "../../models/applicationState";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import { Dictionary } from "lodash";

describe("Json Export Provider", () => {
    const testProject: IProject = {
        id: "1",
        name: "Test Project",
        autoSave: true,
        assets: {
            "a": {
                id: "a",
                name: "Image 1",
                path: ""
            }
        }
        exportFormat: {
            id: "export-provider-1",
            name: "JSON Export Provider",
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
        expect(JsonExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const exportProvider = ExportProviderFactory.create("json", testProject);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(JsonExportProvider);
    });

    it("Exports a vott project into a single JSON file", async () => {
        const assetMetadata: IAssetMetadata = {
            asset: null,
            regions: [],
            timestamp: null,
        };

        const mock = AssetService as jest.Mocked<typeof AssetService>;
        mock.prototype.getAssetMetadata = jest.fn(() => Promise.resolve(assetMetadata));

        const exportProvider = new JsonExportProvider(testProject);
        await exportProvider.export();

        expect(LocalFileSystemProxy.prototype.writeText).toBeCalled();
    });
});

function createTestAssets(count: number): Dictionary<IAsset> {
    const assets: IAsset[] = [];
    for (let i = 1; i <= count; i++) {
        assets.push({
            id: `Asset-${i}`,
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

        return _.keyBy(assets, (asset) => asset.id);
    }
}
