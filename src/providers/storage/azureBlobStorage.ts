import { IStorageProvider } from "./storageProvider";
import { IAsset, AssetType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import { TokenCredential, AnonymousCredential,
    ContainerURL, StorageURL, ServiceURL, Credential, Aborter,
    BlobURL, BlockBlobURL } from "@azure/storage-blob";

export interface IAzureCloudStorageOptions {
    accountName: string;
    containerName: string;
    createContainer: boolean;
    token?: string;
}

export class AzureBlobStorage implements IStorageProvider {

    private static getFileName(path: string) {
        return path.substring(path.indexOf("/") + 1);
    }

    constructor(private options?: IAzureCloudStorageOptions) {}

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

    public listFiles(path: string): Promise<string[]> {
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
                        result.push(blob.name);
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
            const asset = AssetService.createAssetFromFilePath(url);
            if (asset.type !== AssetType.Unknown) {
                result.push(asset);
            }
        }
        return result;
    }

    private getHostName(): string {
        return `https://${this.options.accountName}.blob.core.windows.net`;
    }

    private getCredential(): Credential {
        if (this.options.token) {
            return new TokenCredential(this.options.token);
        } else {
            return new AnonymousCredential();
        }
    }

    private getServiceURL(): ServiceURL {
        const credential = this.getCredential();
        const pipeline = StorageURL.newPipeline(credential);
        const serviceUrl = new ServiceURL(
            this.getHostName(),
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
