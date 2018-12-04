import { IStorageProvider } from "./storageProvider";
import AzureStorageBlob from "../../vendor/azurestoragejs/azure-storage.blob.js";

export interface IAzureCloudStorageOptions {
    connectionString: string;
}

export class AzureCloudStorageService implements IStorageProvider {
    public connectionString = null;

    constructor(private options?: IAzureCloudStorageOptions) {
        this.connectionString = options.connectionString;
    }

    public getService() {
        return AzureStorageBlob.createBlobService(this.connectionString);
    }

    public readText(path: string) {
        return new Promise<string>((resolve, reject) => {
            this.getService().getBlobToText(
                this.getContainerName(path),
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

    public writeText(path: string, contents: string | Buffer) {
        return new Promise<void>((resolve, reject) => {
            this.getService().createBlockBlobFromText(
                this.getContainerName(path),
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
                this.getContainerName(path),
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
                this.getContainerName(path),
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
                this.getContainerName(path),
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
                this.getContainerName(path),
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

    private getContainerName(path: string) {
        return path.substring(0, path.indexOf("/"));
    }

    private getFileName(path: string) {
        return path.substring(path.indexOf("/") + 1);
    }
}
