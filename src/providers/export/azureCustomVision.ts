import _ from "lodash";
import axios, { AxiosRequestConfig } from "axios";
import { ExportProvider, ExportAssetState } from "./exportProvider";
import Guard from "../../common/guard";
import { IProject, IExportFormat, IAsset, AssetState, IAssetMetadata, ITag } from "../../models/applicationState";
import {
    AzureCustomVisionService, IAzureCustomVisionServiceOptions, IAzureCustomVisionProject, IAzureCustomVisionTag, IAzureCustomVisionImage,
} from "./azureCustomVision/azureCustomVisionService";
import { AssetService } from "../../services/assetService";

export interface IAzureCustomVisionExportOptions {
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

export interface ITagList {
    [index: string]: IAzureCustomVisionTag;
}

export enum NewOrExisting {
    New = "New Project",
    Existing = "Existing Project",
}

export class AzureCustomVisionProvider extends ExportProvider<IAzureCustomVisionExportOptions> {
    private customVisionService: AzureCustomVisionService;
    private assetService: AssetService;

    constructor(project: IProject, options: IAzureCustomVisionExportOptions) {
        super(project, options);
        Guard.null(options);

        const cusomVisionServiceOptions: IAzureCustomVisionServiceOptions = {
            apiKey: options.apiKey,
            baseUrl: "https://southcentralus.api.cognitive.microsoft.com/customvision/v2.2/Training",
        };
        this.customVisionService = new AzureCustomVisionService(cusomVisionServiceOptions);
        this.assetService = new AssetService(this.project);
    }

    public async export(): Promise<void> {
        const customVisionTags = await this.syncTags();
        const assetsToExport = await this.getAssetsForExport();
        const tagMap = _.keyBy(customVisionTags, "name");

        const createImageTasks = assetsToExport.map((asset) => {
            return this.uploadAsset(asset);
        });

        await Promise.all(createImageTasks);

        // TODO
        // Get untagged images
        // Get tagged images
        // Delete all images?
        // Re-upload all images with associated tags and regions
    }

    public async save(exportFormat: IExportFormat): Promise<IAzureCustomVisionExportOptions> {
        const customVisionOptions = exportFormat.providerOptions as IAzureCustomVisionExportOptions;

        if (customVisionOptions.newOrExisting === NewOrExisting.Existing) {
            return Promise.resolve(customVisionOptions);
        }

        let customVisionProject: IAzureCustomVisionProject = {
            name: customVisionOptions.name,
            description: customVisionOptions.description,
            classificationType: customVisionOptions.classificationType,
            domainId: customVisionOptions.domainId,
            projectType: customVisionOptions.projectType,
        };

        customVisionProject = await this.customVisionService.create(customVisionProject);

        return {
            assetState: customVisionOptions.assetState,
            apiKey: customVisionOptions.apiKey,
            projectId: customVisionProject.id,
            newOrExisting: NewOrExisting.Existing,
        };
    }

    private async uploadAsset(asset: IAssetMetadata): Promise<IAzureCustomVisionImage> {
        const config: AxiosRequestConfig = {
            responseType: "blob",
        };
        const response = await axios.get(asset.asset.path, config);
        const newImages = await this.customVisionService.createImage(this.options.projectId, response.data);

        return newImages[0];
    }

    private getTagIds(projectTags: ITag[], tagList: ITagList): string[] {
        return projectTags.map((projectTag) => tagList[projectTag.name].id);
    }

    private async getAssetsForExport(): Promise<IAssetMetadata[]> {
        let predicate: (asset: IAsset) => boolean = null;

        switch (this.options.assetState) {
            case ExportAssetState.All:
                predicate = (asset) => true;
                break;
            case ExportAssetState.Visited:
                predicate = (asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged;
                break;
            case ExportAssetState.Tagged:
                predicate = (asset) => asset.state === AssetState.Tagged;
                break;
        }

        const loadAssetTasks = _.values(this.project.assets)
            .filter(predicate)
            .map((asset) => this.assetService.getAssetMetadata(asset));

        return await Promise.all(loadAssetTasks);
    }

    private async syncTags(): Promise<IAzureCustomVisionTag[]> {
        const customVisionOptions = this.project.exportFormat.providerOptions as IAzureCustomVisionExportOptions;
        const customVisionTags = await this.customVisionService.getProjectTags(customVisionOptions.projectId);
        const customVisionTagNames = _.keyBy(customVisionTags, "name");

        const createTagTasks = await this.project.tags
            .filter((projectTag) => {
                return !customVisionTagNames[projectTag.name];
            }).map((projectTag) => {
                const newTag: IAzureCustomVisionTag = {
                    name: projectTag.name,
                };
                return this.customVisionService.createTag(customVisionOptions.projectId, newTag);
            });

        const newTags = await Promise.all(createTagTasks);
        return customVisionTags.concat(newTags);
    }
}
