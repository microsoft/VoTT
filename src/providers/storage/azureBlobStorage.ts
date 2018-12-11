import { IStorageProvider } from "./storageProvider";
import AzureStorageBlob from "../../vendor/azurestoragejs/azure-storage.blob.js";
import { IAsset, AssetType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";

export interface IAzureCloudStorageOptions {
    connectionString: string;
    containerName: string;
    createContainer: boolean;
}

export class AzureCloudStorageService implements IStorageProvider {

    private static getHostName(connectionString: string): string {
        const accountName = AzureCloudStorageService.getAccountName(connectionString);
        return `https://${accountName}.blob.core.windows.net`;
    }

    private static getAccountName(connectionString: string): string {
        const regex = /AccountName=([a-zA-Z0-9-]*)/g;
        const match = regex.exec(connectionString);
        return match[1];
    }

    private static getFileName(path: string) {
        return path.substring(path.indexOf("/") + 1);
    }
    constructor(private options?: IAzureCloudStorageOptions) {
    }

    public readText(path: string) {
        return new Promise<string>((resolve, reject) => {
            this.getService().getBlobToText(
                this.options.containerName,
                AzureCloudStorageService.getFileName(path),
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                },
            );
        });
    }

    public async readBinary(path: string) {
        const text = await this.readText(path);
        return Buffer.from(text);
    }

    public async writeText(path: string, contents: string | Buffer) {
        if (this.options.createContainer) {
            await this.createContainer(this.options.containerName);
        }
        return new Promise<void>((resolve, reject) => {
            this.getService().createBlockBlobFromText(
                this.options.containerName,
                AzureCloudStorageService.getFileName(path),
                contents,
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                },
            );
        });
    }

    public writeBinary(path: string, contents: Buffer) {
        return this.writeText(path, contents);
    }

    public deleteFile(path: string) {
        return new Promise<void>((resolve, reject) => {
            this.getService().deleteBlobIfExists(
                this.options.containerName,
                AzureCloudStorageService.getFileName(path),
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                },
            );
        });
    }

    public listFiles(path: string) {
        return new Promise<string[]>((resolve, reject) => {
            this.getService().listBlobsSegmented(
                this.options.containerName,
                null,
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                },
            );
        });
    }

    public listContainers(path: string) {
        return new Promise<string[]>((resolve, reject) => {
            this.getService().listContainersSegmented(null, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    public createContainer(path: string) {
        return new Promise<void>((resolve, reject) => {
            const service = this.getService();
            service.createContainerIfNotExists(
                this.options.containerName,
                { publicAccessLevel: "blob" },
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                },
            );
        });
    }

    public deleteContainer(path: string) {
        return new Promise<void>((resolve, reject) => {
            this.getService().deleteContainer(
                this.options.containerName,
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                },
            );
        });
    }

    public async getAssets(path?: string): Promise<IAsset[]> {
        if (this.options.containerName) {
            path = path ? [this.options.containerName, path].join("/") : this.options.containerName;
        }
        const files = await this.listFiles(path);
        const result: IAsset[] = [];
        for (const key of Object.keys(files.entries)) {
            const url = this.getUrl(files.entries[key].name);
            const asset = AssetService.createAssetFromFilePath(url);
            if (asset.type !== AssetType.Unknown) {
                result.push(asset);
            }
        }
        return result;
    }

    private getService() {
        return AzureStorageBlob.createBlobService(this.options.connectionString);
    }

    private getUrl(blobName: string) {
        return this.getService().getUrl(
            this.options.containerName,
            blobName,
            null,
            AzureCloudStorageService.getHostName(this.options.connectionString),
        );
    }
}
