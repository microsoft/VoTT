import axios, { AxiosRequestConfig } from "axios";
import { createQueryString } from "../../../common/utils";
import Guard from "../../../common/guard";

export interface IAzureCustomVisionServiceOptions {
    baseUrl: string;
    apiKey: string;
}

export interface IAzureCustomVisionProject {
    id?: string;
    name: string;
    description?: string;
    projectType: string;
    domainId: string;
    classificationType: string;
}

export interface IAzureCustomVisionTag {
    id?: string;
    name: string;
    description?: string;
    imageCount?: number;
}

export interface IAzureCustomVisionImage {
    id: string;
    width: number;
    height: number;
    imageUri: string;
    tags: [];
    regions: [];
}

export interface IAzureCustomVisionRegion {
    imageId: string;
    tagId: string;
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * @name Azure Custom Vision Service
 * @description REST API wrapper for Azure Custom Vision service
 */
export class AzureCustomVisionService {
    constructor(private options: IAzureCustomVisionServiceOptions) {
        Guard.null(options);
    }

    /**
     * Creates an Azure Custom Vision project
     * @param project - The Azure Custom Vision Project settings
     */
    public async create(project: IAzureCustomVisionProject): Promise<IAzureCustomVisionProject> {
        Guard.null(project);

        const urlParams = {
            name: project.name,
            description: project.description,
            projectType: project.projectType,
            domainId: project.domainId,
            classificationType: project.classificationType,
        };

        const url = `${this.options.baseUrl}/projects?${createQueryString(urlParams)}`;
        const response = await axios.post(url, null, this.createRequestConfig());

        if (response.status !== 200) {
            throw new Error("Error creating new project");
        }

        return response.data as IAzureCustomVisionProject;
    }

    /**
     * Get the tags of a Azure Custom Vision project
     * @param projectId The Azure Custom Vision project ID
     */
    public async getProjectTags(projectId: string): Promise<IAzureCustomVisionTag[]> {
        Guard.empty(projectId);

        const url = `${this.options.baseUrl}/projects/${projectId}/tags`;
        const response = await axios.get(url, this.createRequestConfig());

        if (response.status !== 200) {
            throw new Error("Error retrieving project tags");
        }

        return response.data as IAzureCustomVisionTag[];
    }

    /**
     * Creates a new Azure Custom Vision Tag
     * @param projectId The Azure Custom vision project id
     * @param tag The tag to save
     */
    public async createTag(projectId: string, tag: IAzureCustomVisionTag): Promise<IAzureCustomVisionTag> {
        Guard.empty(projectId);
        Guard.null(tag);

        const urlParams = {
            name: tag.name,
            description: tag.description,
        };

        const url = `${this.options.baseUrl}/projects/${projectId}/tags?${createQueryString(urlParams)}`;
        const response = await axios.post(url, null, this.createRequestConfig());

        if (response.status !== 200) {
            throw new Error("Error saving tag");
        }

        return response.data as IAzureCustomVisionTag;
    }

    /**
     * Uploads a new image to an Azure Custom Vision project
     * @param projectId The Azure Custom vision project id
     * @param contents The asset binary contents
     */
    public async createImage(projectId: string, contents: File | Blob | ArrayBuffer): Promise<IAzureCustomVisionImage> {
        Guard.empty(projectId);
        Guard.null(contents);

        const url = `${this.options.baseUrl}/projects/${projectId}/images`;
        const config = this.createRequestConfig();
        config.headers["Content-Type"] = "application/octet-stream";
        const response = await axios.post(url, contents, config);

        if (response.status !== 200) {
            throw new Error("Error saving image");
        }

        if (!response.data.images || response.data.images.length === 0) {
            throw new Error("Error uploading image");
        }

        return response.data.images[0].image as IAzureCustomVisionImage;
    }

    /**
     * Creates a new region with tags and associated it with an image
     * @param projectId The Azure Custom vision project id
     * @param regions The regions to create
     */
    public async createRegions(projectId: string, regions: IAzureCustomVisionRegion[]): Promise<void> {
        Guard.empty(projectId);
        Guard.null(regions);

        const url = `${this.options.baseUrl}/projects/${projectId}/images/regions`;
        const response = await axios.post(url, { regions }, this.createRequestConfig());

        if (response.status !== 200) {
            throw new Error("Error saving image regions");
        }
    }

    private createRequestConfig(): AxiosRequestConfig {
        return {
            headers: {
                "Training-key": this.options.apiKey,
            },
        };
    }
}
