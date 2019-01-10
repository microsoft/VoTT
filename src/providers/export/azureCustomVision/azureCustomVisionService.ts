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

export class AzureCustomVisionService {
    constructor(private options: IAzureCustomVisionServiceOptions) {
        Guard.null(options);
    }

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

        return response.data as IAzureCustomVisionProject;
    }

    public async getProjectTags(projectId: string): Promise<IAzureCustomVisionTag[]> {
        Guard.emtpy(projectId);

        const url = `${this.options.baseUrl}/projects/${projectId}/tags`;
        const response = await axios.get(url, this.createRequestConfig());

        return response.data as IAzureCustomVisionTag[];
    }

    public async createTag(projectId: string, tag: IAzureCustomVisionTag): Promise<IAzureCustomVisionTag> {
        Guard.emtpy(projectId);
        Guard.null(tag);

        const urlParams = {
            name: tag.name,
            description: tag.description,
        };

        const url = `${this.options.baseUrl}/projects/${projectId}/tags?${createQueryString(urlParams)}`;
        const response = await axios.post(url, null, this.createRequestConfig());

        return response.data as IAzureCustomVisionTag;
    }

    public async createImage(projectId: string, contents: File | Blob, tagIds: string[] = []) {
        Guard.emtpy(projectId);
        Guard.null(contents);

        const url = `${this.options.baseUrl}/projects/${projectId}/images?tagIds=${tagIds.join(",")}`;
        const config = this.createRequestConfig();
        config.headers["Content-Type"] = "application/octet-stream";
        const response = await axios.post(url, contents, config);

        return response.data.images as IAzureCustomVisionImage[];
    }

    private createRequestConfig(): AxiosRequestConfig {
        const config: AxiosRequestConfig = {
            headers: {
                "Training-key": this.options.apiKey,
            },
        };

        return config;
    }
}
