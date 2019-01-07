import { IStorageProvider } from "./storageProvider";
import { IAsset, AssetType, StorageType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import { TokenCredential, AnonymousCredential,
    ContainerURL, StorageURL, ServiceURL, Credential, Aborter,
    BlobURL, BlockBlobURL } from "@azure/storage-blob";

export interface IAzureCloudStorageOptions {
    accountName: string;
    containerName: string;
    createContainer: boolean;
    oauthToken?: string;
    sas?: string;
}

export class AzureBlobStorage implements IStorageProvider {

    public storageType: StorageType.Cloud;

    constructor(private options?: IAzureCloudStorageOptions) {}

    public initialize(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const containerName = this.options.containerName;
                if (this.options.createContainer) {
                    await this.createContainer(containerName);
                    resolve();
                } else {
                    const containers = await this.listContainers(null);
                    if (containers.indexOf(containerName) > -1) {
                        resolve();
                    } else {
                        throw new Error(`Container "${containerName}" does not exist`);
                    }
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    public readText(blobName: string): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                const blockBlobURL = this.getBlockBlobURL(blobName);
                const downloadResponse = await blockBlobURL.download(Aborter.none, 0);
                const downloadString = await this.bodyToString(downloadResponse);
                resolve(downloadString);
            } catch (e) {
                reject(e);
            }
        });
    }

    public async readBinary(path: string) {
        const text = await this.readText(path);
        return Buffer.from(text);
    }

    public async writeText(blobName: string, content: string | Buffer) {
        // await this.initialize(); // TODO Move this to more central location, called by IStorageProvider
        return new Promise<void>(async (resolve, reject) => {
            try {
                const blockBlobURL = this.getBlockBlobURL(blobName);
                const uploadBlobResponse = await blockBlobURL.upload(
                    Aborter.none,
                    content,
                    content.length,
                );
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    public writeBinary(blobName: string, content: Buffer) {
        return this.writeText(blobName, content);
    }

    public deleteFile(blobName: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this.getBlockBlobURL(blobName).delete(Aborter.none);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    public listFiles(path: string, ext?: string): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            try {
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
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

    public listContainers(path: string) {
        return new Promise<string[]>(async (resolve, reject) => {
            try {
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
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

    public createContainer(containerName: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const containerURL = this.getContainerURL();
                const createContainerResponse = await containerURL.create(Aborter.none);
                resolve();
            } catch (e) {
                reject(e);
            }

        });
    }

    public deleteContainer(path: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this.getContainerURL().delete(Aborter.none);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

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

    public getFileName(url: string) {
        const pathParts = url.split("/");
        return pathParts[pathParts.length - 1].split("?")[0];
    }

    public getAccountUrl(): string {
        return `https://${this.options.accountName}.blob.core.windows.net` + (this.options.sas || "");
    }

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
        const blob = await response.blobBody!;
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
