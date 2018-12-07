import Guard from "../../common/guard";
import { IProject } from "../../models/applicationState";
import { IStorageProvider, StorageProviderFactory } from "../storage/storageProvider";
import { IAssetProvider, AssetProviderFactory } from "../storage/assetProvider";

export interface IExportProvider {
    project: IProject;
    export(): Promise<void>;
}

export abstract class ExportProvider<TOptions> implements IExportProvider {
    private storageProviderInstance: IStorageProvider;
    private assetProviderInstance: IAssetProvider;

    constructor(public project: IProject, protected options?: TOptions) {
        Guard.null(project);
    }

    public abstract export(): Promise<void>;

    /**
     * Gets the storage provider for the current project
     */
    protected get storageProvider(): IStorageProvider {
        if (this.storageProviderInstance) {
            return this.storageProviderInstance;
        }

        this.storageProviderInstance = StorageProviderFactory.create(
            this.project.targetConnection.providerType,
            this.project.targetConnection.providerOptions,
        );

        return this.storageProviderInstance;
    }

    /**
     * Gets the asset provider for the current project
     */
    protected get assetProvider(): IAssetProvider {
        if (this.assetProviderInstance) {
            return this.assetProviderInstance;
        }

        this.assetProviderInstance = AssetProviderFactory.create(
            this.project.sourceConnection.providerType,
            this.project.sourceConnection.providerOptions,
        );

        return this.assetProviderInstance;
    }
}
