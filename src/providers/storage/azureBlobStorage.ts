import { IStorageProvider } from './storageProvider'
var AzureStorageBlob = require('./azurestoragejs/azure-storage.blob.js')

export interface AzureCloudStorageOptions {
    connectionString: string;
}

export class AzureCloudStorageService implements IStorageProvider {
    connectionString = null;

    constructor(private options?: AzureCloudStorageOptions){
        this.connectionString = options.connectionString;
    }

    getService() {
        return AzureStorageBlob.createBlobService(this.connectionString);
    }

    getContainerName(path: string){
        return path.substring(0, path.indexOf('/'));
    }

    getFileName(path: string){
        return path.substring(path.indexOf('/') + 1);
    }

    readText(path: string){
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
                }
            );
        });
    }

    async readBinary(path: string){
        var text = await this.readText(path);
        return Buffer.from(text);
    }

    
    writeText(path: string, contents: string | Buffer){
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
                }
            );
        });
    }

    writeBinary(path: string, contents: Buffer){
        return this.writeText(path, contents);
    }

    deleteFile(path: string){
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
                }
            );
        });
    }

    listFiles(path: string){
        return new Promise<string[]>((resolve, reject) => {
            this.getService().listBlobsSegmented(
                this.getContainerName(path), 
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            );
        });
    }

    listContainers(path: string){
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

    createContainer(path: string){
        return new Promise<void>((resolve, reject) => {
            var service = this.getService();
            service.createContainerIfNotExists(
                this.getContainerName(path), 
                { publicAccessLevel: 'blob' }, 
                err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    deleteContainer(path: string){
        return new Promise<void>((resolve, reject) => {
            this.getService().deleteContainer(
                this.getContainerName(path),
                err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }
}