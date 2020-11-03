import { IAssetMetadata, IExportFormat, IProject } from "../../models/applicationState";

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

export interface IExportAssetResult {
    asset: IAssetMetadata;
    success: boolean;
    error?: string;
}

export interface IExportResults {
    completed: IExportAssetResult[];
    errors: IExportAssetResult[];
    count: number;
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
    export(): Promise<void> | Promise<IExportResults>;
    save?(exportFormat: IExportFormat): Promise<any>;
}
