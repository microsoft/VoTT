import axios, { AxiosRequestConfig } from "axios";
import { ExportProvider, ExportAssetState } from "./exportProvider";
import Guard from "../../common/guard";
import { IProject, IExportFormat } from "../../models/applicationState";

/**
 * Options for Azure Custom Vision Service
 */
export interface IAzureCustomVisionOptions {
    assetState: ExportAssetState;
    newOrExisting: NewOrExisting;
    apiKey: string;
    projectId?: string;
    name?: string;
    description?: string;
    projectType?: string;
    classificationType?: string;
    domainId?: string;
}

/**
 * Enum for new or existing Custom Vision projects
 */
export enum NewOrExisting {
    New = "New Project",
    Existing = "Existing Project",
}

/**
 * Export provider for Azure Custom Vision Service
 */
export class AzureCustomVisionProvider extends ExportProvider<IAzureCustomVisionOptions> {
    constructor(project: IProject, options: IAzureCustomVisionOptions) {
        super(project, options);
        Guard.null(options);
    }

    /**
     * Export project to Azure Custom Vision service
     */
    public export(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    /**
     * Save export format to Azure Custom Vision Service via REST API
     * @param exportFormat Provider type and options for export
     */
    public async save(exportFormat: IExportFormat): Promise<IAzureCustomVisionOptions> {
        const customVisionOptions = exportFormat.providerOptions as IAzureCustomVisionOptions;

        if (customVisionOptions.newOrExisting === NewOrExisting.Existing) {
            return Promise.resolve(customVisionOptions);
        }

        const urlParams = {
            name: customVisionOptions.name,
            description: customVisionOptions.description,
            projectType: customVisionOptions.projectType,
            domainId: customVisionOptions.domainId,
            classificationType: customVisionOptions.classificationType,
        };

        const queryString = this.createQueryString(urlParams);
        const config: AxiosRequestConfig = {
            headers: {
                "Training-key": customVisionOptions.apiKey,
            },
        };

        // tslint:disable-next-line:max-line-length
        const url = `https://southcentralus.api.cognitive.microsoft.com/customvision/v2.2/Training/projects?${queryString}`;
        const response = await axios.post(url, null, config);

        return {
            assetState: customVisionOptions.assetState,
            apiKey: customVisionOptions.apiKey,
            projectId: response.data.id,
            newOrExisting: NewOrExisting.Existing,
        };
    }

    private createQueryString(object: any): string {
        const parts: any[] = [];

        for (const key of Object.getOwnPropertyNames(object)) {
            parts.push(`${key}=${encodeURIComponent(object[key])}`);
        }

        return parts.join("&");
    }
}
