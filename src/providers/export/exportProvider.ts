import Guard from "../../common/guard";
import { IProject } from "../../models/applicationState";
import { IStorageProvider, StorageProviderFactory } from "../storage/storageProvider";
import { IAssetProvider, AssetProviderFactory } from "../storage/assetProvider";

/**
 * @name - TF Pascal VOC Records Export Asset State
 * @description - Defines the asset type export option
 * @member All - Specifies that all assets will be exported
 * @member Visited - Specifies that visited (including tagged) assets will be exported
 * @member Tagged - Specifies that only tagged assets will be exported
 */
export enum ExportAssetState {
    All = "all",
    Visited = "visited",
    Tagged = "tagged",
}

/**
 * @name - IExportProvider
 * @description - Defines the required interface for all VoTT export providers
 */
export interface IExportProvider {
    /**
     * Gets or set the project to be exported
     */
    project: IProject;

    /**
     * Exports the configured project for specified export configuration
     */
    export(): Promise<void>;
}

/**
 * Base class implementation for all VoTT export providers
 * Provides quick access to the configured projects asset & storage providers
 */
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
