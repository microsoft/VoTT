import { IStorageProvider } from "./storageProvider";
import AzureStorageBlob from "../../vendor/azurestoragejs/azure-storage.blob.js";
import { IAsset } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";

export interface IAzureCloudStorageOptions {
    connectionString: string;
    containerName: string;
    createContainer: boolean;
}

export class AzureCloudStorageService implements IStorageProvider {
    constructor(private options?: IAzureCloudStorageOptions) {
    }

    public readText(path: string) {
        return new Promise<string>((resolve, reject) => {
            this.getService().getBlobToText(
                this.options.containerName,
                this.getFileName(path),
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
                this.getFileName(path),
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
                this.getFileName(path),
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
        return files.map((blobPath) => AssetService.createAssetFromFilePath(blobPath));
    }

    private getService() {
        return AzureStorageBlob.createBlobService(this.options.connectionString);
    }

    private getContainerName(path: string) {
        return path.indexOf("/") > -1 ? path.substring(0, path.indexOf("/")) : path;
    }

    private getFileName(path: string) {
        return path.substring(path.indexOf("/") + 1);
    }
}
