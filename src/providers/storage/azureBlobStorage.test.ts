
var AzureStorageBlob = require('./azurestoragejs/azure-storage.blob.js')
import { AzureCloudStorageService } from './azureBlobStorage'

class FakeBlobService {
    static getBlobToText = jest.fn((...params) => Promise.resolve());
    static deleteBlobIfExists = jest.fn((...params) => Promise.resolve());
    static createBlockBlobFromText = jest.fn((...params) => Promise.resolve());
    static createContainerIfNotExists = jest.fn((...params) => Promise.resolve());
    static listBlobsSegmented = jest.fn((...params) => Promise.resolve());
    static listContainersSegmented = jest.fn((...params) => Promise.resolve());
    static deleteContainer = jest.fn((...params) => Promise.resolve());
}

const connStr = "fake connection string";
const path = "container/filename.txt";
const containerName = "container";
const fileName = "filename.txt";
const content = "This is the content";

describe("Azure blob functions", () => {
    
    it("Create blob service", () =>  {
        AzureStorageBlob.createBlobService = jest.fn(() => Promise.resolve());
        var azure = new AzureCloudStorageService(connStr);
        var service = azure.getService();
        expect(AzureStorageBlob.createBlobService).toBeCalledWith(connStr);
    })

    it("Helper methods should give correct container and filename", () => {
        var azure = new AzureCloudStorageService(connStr);
        expect(azure.getContainerName(path)).toBe(containerName);
        expect(azure.getFileName(path)).toBe(fileName);
    })

    it("Get Blob to Text", () =>  {
        var azure = new AzureCloudStorageService(connStr);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.readText(path);
        expect(FakeBlobService.getBlobToText).toBeCalledWith(
            containerName,
            fileName,
            expect.any(Function)
        );
    })

    it("Get Blob to Binary", () =>  {
        // Skipping for now
    })

    it("Write text", () =>  {
        var azure = new AzureCloudStorageService(connStr);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.writeText(path, content);
        expect(FakeBlobService.createBlockBlobFromText).toBeCalledWith(
            containerName,
            fileName,
            content,
            expect.any(Function)
        );
    })

    it("Write binary", () =>  {
        // Skipping for now, but 'createBlockBlobFromText' also takes a buffer
    })

    it("Delete file", () =>  {
        var azure = new AzureCloudStorageService(connStr);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.deleteFile(path);
        expect(FakeBlobService.deleteBlobIfExists).toBeCalledWith(
            containerName,
            fileName,
            expect.any(Function)
        );
    })

    it("List files", () =>  {
        var azure = new AzureCloudStorageService(connStr);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.listFiles(path);
        expect(FakeBlobService.listBlobsSegmented).toBeCalledWith(
            containerName,
            expect.any(Function)
        );
    })

    it("List containers", () =>  {
        var azure = new AzureCloudStorageService(connStr);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.listContainers(path);
        expect(FakeBlobService.listContainersSegmented).toBeCalledWith(
            null,
            expect.any(Function)
        );
    })

    it("Create container", () =>  {
        var azure = new AzureCloudStorageService(connStr);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.createContainer(path);
        expect(FakeBlobService.createContainerIfNotExists).toBeCalledWith(
            containerName,
            { publicAccessLevel: 'blob' },
            expect.any(Function)
        );
    })
})