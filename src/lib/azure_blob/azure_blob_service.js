const path = require('path');
const AzureStorage = require('azure-storage');

export class AzureBlobService {

    getService(){
        // Uses AZURE_STORAGE_CONNECTION_STRING env variable
        return AzureStorage.createBlobService();
    }

    createContainer (containerName) {
        return new Promise((resolve, reject) => {
            this.getService().createContainerIfNotExists(containerName, { publicAccessLevel: 'blob' }, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: `Container '${containerName}' created` });
                }
            });
        });
    }

    listContainers () {
        return new Promise((resolve, reject) => {
            this.getService().listContainersSegmented(null, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: `${data.entries.length} containers`, containers: data.entries });
                }
            });
        });
    }

    listBlobs (containerName) {
        return new Promise((resolve, reject) => {
            this.getService().listBlobsSegmented(containerName, null, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: `${data.entries.length} blobs in '${containerName}'`, blobs: data.entries });
                }
            });
        });
    }

    getBlobToText (containerName, blobName) {
        return new Promise((resolve, reject) => {
            this.getService().getBlobToText(containerName, blobName, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: `Blob downloaded "${data}"`, text: data });
                }
            });
        });
    }

    createBlobFromText (containerName, blobName, text) {
        return new Promise((resolve, reject) => {
            this.getService().createBlockBlobFromText(containerName, blobName, text, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: `Text "${text}" is written to blob storage` });
                }
            });
        });
    }

    uploadLocalFile (containerName, filePath) {
        return new Promise((resolve, reject) => {
            const fullPath = path.resolve(filePath);
            const blobName = path.basename(filePath);
            this.getService().createBlockBlobFromLocalFile(containerName, blobName, fullPath, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: `Local file "${filePath}" is uploaded` });
                }
            });
        });
    }

    
    deleteContainer (containerName) {
        return new Promise((resolve, reject) => {
            this.getService().deleteContainer(containerName, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: `Container '${containerName}' deleted` });
                }
            });
        });
    }    

    deleteBlob (containerName, blobName) {
        return new Promise((resolve, reject) => {
            this.getService().deleteBlobIfExists(containerName, blobName, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: `Block blob '${blobName}' deleted` });
                }
            });
        });
    }
}
