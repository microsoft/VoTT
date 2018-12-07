import { ExportProvider } from "./exportProvider";
import { IProject } from "../../models/applicationState";
import { ExportProviderFactory } from "./exportProviderFactory";
import registerProviders from "../../registerProviders";

describe("Export Provider Base", () => {
    const testProject: IProject = {
        id: "1",
        name: "Test Project",
        autoSave: true,
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

    it("initializes the asset and storage providers", () => {
        registerProviders();

        ExportProviderFactory.register("test", (project) => new TestExportProvider(project));
        const exportProvider = ExportProviderFactory.create("test", testProject) as TestExportProvider;
        const assetProvider = exportProvider.getAssetProvider();
        const storageProvider = exportProvider.getStorageProvider();

        expect(assetProvider).not.toBeNull();
        expect(storageProvider).not.toBeNull();
    });
});

class TestExportProvider extends ExportProvider<{}> {
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
