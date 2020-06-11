import { IStorageProvider } from "./storageProviderFactory";
import { IAsset, AssetType, StorageType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import {
    TokenCredential, AnonymousCredential, ContainerURL,
    StorageURL, ServiceURL, Credential, Aborter, BlockBlobURL,
} from "@azure/storage-blob";
import { BlobDeleteResponse } from "@azure/storage-blob/typings/lib/generated/lib/models";

/**
 * Options for Azure Cloud Storage
 * @member accountName - Name of Storage Account
 * @member containerName - Name of targeted container
 * @member createContainer - Option for creating container in `initialize()`
 * @member sas - Shared Access Signature (SAS) token for accessing Azure Blob Storage
 * @member oauthToken - Not yet implemented. Optional token for accessing Azure Blob Storage
 */
export interface IAzureCloudStorageOptions {
    accountName: string;
    containerName: string;
    createContainer: boolean;
    sas?: string;
    oauthToken?: string;
}

/**
 * Storage Provider for Azure Blob Storage
 */
export class AzureBlobStorage implements IStorageProvider {

    /**
     * Storage type
     * @returns - StorageType.Cloud
     */
    public storageType: StorageType = StorageType.Cloud;

    constructor(private options?: IAzureCloudStorageOptions) { }

    /**
     * Initialize connection to Blob Storage account & container
     * If `createContainer` was specified in options, this function
     * creates the container. Otherwise, validates that container
     * is contained in list of containers
     * @throws - Error if container does not exist or not able to
     * connect to Azure Blob Storage
     */
    public async initialize(): Promise<void> {
        const containerName = this.options.containerName;
        if (this.options.createContainer) {
            await this.createContainer(containerName);
        } else {
            const containers = await this.listContainers(null);
            if (containers.indexOf(containerName) === -1) {
                throw new Error(`Container "${containerName}" does not exist`);
            }
        }
    }

    /**
     * Reads text from specified blob
     * @param blobName - Name of blob in container
     */
    public async readText(blobName: string): Promise<string> {
        const blockBlobURL = this.getBlockBlobURL(blobName);
        const downloadResponse = await blockBlobURL.download(Aborter.none, 0);

        return await this.bodyToString(downloadResponse);
    }

    /**
     * Reads Buffer from specified blob
     * @param blobName - Name of blob in container
     */
    public async readBinary(blobName: string) {
        const text = await this.readText(blobName);
        return Buffer.from(text);
    }

    /**
     * Writes text to blob in container
     * @param blobName - Name of blob in container
     * @param content - Content to write to blob (string or Buffer)
     */
    public async writeText(blobName: string, content: string | Buffer) {
        const blockBlobURL = this.getBlockBlobURL(blobName);
        await blockBlobURL.upload(
            Aborter.none,
            content,
            content.length,
        );
    }

    /**
     * Writes buffer to blob in container
     * @param blobName - Name of blob in container
     * @param content - Buffer to write to blob
     */
    public writeBinary(blobName: string, content: Buffer) {
        return this.writeText(blobName, content);
    }

    /**
     * Deletes file from container
     * @param blobName - Name of blob in container
     */
    public async deleteFile(blobName: string): Promise<void> {
        await this.getBlockBlobURL(blobName).delete(Aborter.none);
    }

    /**
     * Lists files in container
     * @param path - NOT USED IN CURRENT IMPLEMENTATION. Only uses container
     * as specified in Azure Cloud Storage Options. Included to satisfy
     * Storage Provider interface
     * @param ext - Extension of files to filter on when retrieving files
     * from container
     */
    public async listFiles(path: string, ext?: string): Promise<string[]> {
        const result: string[] = [];
        let marker;
        const containerURL = this.getContainerURL();
        do {
            const listBlobsResponse = await containerURL.listBlobFlatSegment(
                Aborter.none,
                marker,
            );
            marker = listBlobsResponse.nextMarker;
            for (const blob of listBlobsResponse.segment.blobItems) {
                if ((ext && blob.name.endsWith(ext)) || !ext) {
                    result.push(blob.name);
                }
            }
        } while (marker);

        return result;
    }

    /**
     * Lists the containers with in the Azure Blob Storage account
     * @param path - NOT USED IN CURRENT IMPLEMENTATION. Lists containers in storage account.
     * Path does not really make sense in this scenario. Included to satisfy interface
     */
    public async listContainers(path: string) {
        const result: string[] = [];
        let marker;
        do {
            const listContainersResponse = await this.getServiceURL().listContainersSegment(
                Aborter.none,
                marker,
            );
            marker = listContainersResponse.nextMarker;
            for (const container of listContainersResponse.containerItems) {
                result.push(container.name);
            }
        } while (marker);

        return result;
    }

    /**
     * Creates container specified in Azure Cloud Storage options
     * @param containerName - NOT USED IN CURRENT IMPLEMENTATION. Because `containerName`
     * is a required attribute of the Azure Cloud Storage options used to instantiate the
     * provider, this function creates that container. Included to satisfy interface
     */
    public async createContainer(containerName: string): Promise<void> {
        const containerURL = this.getContainerURL();
        try {
            await containerURL.create(Aborter.none);
        } catch (e) {
            if (e.statusCode === 409) {
                return;
            }

            throw e;
        }
    }

    /**
     * Deletes container specified in Azure Cloud Storage options
     * @param containerName - NOT USED IN CURRENT IMPLEMENTATION. Because `containerName`
     * is a required attribute of the Azure Cloud Storage options used to instantiate the
     * provider, this function creates that container. Included to satisfy interface
     */
    public async deleteContainer(containerName: string): Promise<void> {
        await this.getContainerURL().delete(Aborter.none);
    }

    /**
     * Retrieves assets from Azure Blob Storage container
     * @param containerName - Container from which to retrieve assets. Defaults to
     * container specified in Azure Cloud Storage options
     */
    public async getAssets(containerName?: string): Promise<IAsset[]> {
        containerName = (containerName) ? containerName : this.options.containerName;
        const files = await this.listFiles(containerName);
        const result: IAsset[] = [];
        for (const file of files) {
            const url = this.getUrl(file);
            const asset = AssetService.createAssetFromFilePath(url, this.getFileName(url));
            if (asset.type !== AssetType.Unknown) {
                result.push(asset);
            }
        }
        return result;
    }

    /**
     *
     * @param url - URL for Azure Blob
     */
    public getFileName(url: string) {
        const pathParts = url.split("/");
        return pathParts[pathParts.length - 1].split("?")[0];
    }

    /**
     * @returns - URL for Azure Blob Storage account with SAS token appended if specified
     */
    public getAccountUrl(): string {
        return `https://${this.options.accountName}.blob.core.windows.net` + (this.options.sas || "");
    }

    /**
     * Gets a Credential object. OAuthToken if specified in options, anonymous
     * credential otherwise (uses the SAS token)
     * @returns - Credential object from Azure Storage SDK
     */
    private getCredential(): Credential {
        if (this.options.oauthToken) {
            return new TokenCredential(this.options.oauthToken);
        } else {
            return new AnonymousCredential();
        }
    }

    private getServiceURL(): ServiceURL {
        const credential = this.getCredential();
        const pipeline = StorageURL.newPipeline(credential);
        const accountUrl = this.getAccountUrl();
        const serviceUrl = new ServiceURL(
            accountUrl,
            pipeline,
        );
        return serviceUrl;
    }

    private getContainerURL(serviceURL?: ServiceURL, containerName?: string): ContainerURL {
        return ContainerURL.fromServiceURL(
            (serviceURL) ? serviceURL : this.getServiceURL(),
            (containerName) ? containerName : this.options.containerName,
        );
    }

    private getBlockBlobURL(blobName: string): BlockBlobURL {
        const containerURL = this.getContainerURL();
        return BlockBlobURL.fromContainerURL(
            containerURL,
            blobName,
        );
    }

    private getUrl(blobName: string): string {
        return this.getBlockBlobURL(blobName).url;
    }

    private async bodyToString(
        response: {
            readableStreamBody?: NodeJS.ReadableStream;
            blobBody?: Promise<Blob>;
        },
        // tslint:disable-next-line:variable-name
        _length?: number,
    ): Promise<string> {
        const blob = await response.blobBody;
        return this.blobToString(blob);
    }

    private async blobToString(blob: Blob): Promise<string> {
        const fileReader = new FileReader();

        return new Promise<string>((resolve, reject) => {
            fileReader.onloadend = (ev: any) => {
                resolve(ev.target!.result);
            };
            fileReader.onerror = reject;
            fileReader.readAsText(blob);
        });
    }
}
