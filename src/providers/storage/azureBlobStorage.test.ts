var AzureStorageBlob = require('./azurestoragejs/azure-storage.blob.js')
import { AzureCloudStorageService, AzureCloudStorageOptions } from './azureBlobStorage'
import { StorageProviderFactory, IStorageProvider } from './storageProvider';

const content = "This is the content";
const containers = ["container1", "container2", "container3"]
const files = ["file1.txt", "file2.txt", "file3.txt"]
const path = "container/filename.txt";
const containerName = "container";
const fileName = "filename.txt";

class FakeBlobService {
    
    static getBlobToText = jest.fn(() => Promise.resolve(content));
    static deleteBlobIfExists = jest.fn(() => Promise.resolve());
    static createBlockBlobFromText = jest.fn(() => Promise.resolve());
    static createContainerIfNotExists = jest.fn(() => Promise.resolve());
    static listBlobsSegmented = jest.fn(() => Promise.resolve(files));
    static listContainersSegmented = jest.fn(() => Promise.resolve(containers));
    static deleteContainer = jest.fn(() => Promise.resolve());
}

describe("Azure blob functions", () => {

    let provider: IStorageProvider = null;
    let options: AzureCloudStorageOptions = null;


    beforeAll(() => {
        options = {
            connectionString: "fake connection string"
        };
    })
    
    beforeEach(() => {
        provider = new AzureCloudStorageService(options);
    });

    it('Provider is registered with the StorageProviderFactory', () => {
        const storageProvider = StorageProviderFactory.create('azureBlobStorage', options);
        expect(storageProvider).not.toBeNull();
    });
    
    it("Create blob service", () =>  {
        AzureStorageBlob.createBlobService = jest.fn(() => Promise.resolve());
        var azure = new AzureCloudStorageService(options);
        var service = azure.getService();
        expect(AzureStorageBlob.createBlobService).toBeCalledWith(options.connectionString);
    })

    it("Helper methods should give correct container and filename", () => {
        var azure = new AzureCloudStorageService(options);
        expect(azure.getContainerName(path)).toBe(containerName);
        expect(azure.getFileName(path)).toBe(fileName);
    })

    it("Get Blob to Text", () =>  {
        var azure = new AzureCloudStorageService(options);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.readText(path)
            .then((text) => {
                expect(text).toBe(content)
            })
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
        var azure = new AzureCloudStorageService(options);
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
        var azure = new AzureCloudStorageService(options);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.deleteFile(path);
        expect(FakeBlobService.deleteBlobIfExists).toBeCalledWith(
            containerName,
            fileName,
            expect.any(Function)
        );
    })

    it("List files", () =>  {
        var azure = new AzureCloudStorageService(options);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.listFiles(path)
            .then((result) => {
                expect(result).toBe(files)
            })
        expect(FakeBlobService.listBlobsSegmented).toBeCalledWith(
            containerName,
            expect.any(Function)
        );
    })

    it("List containers", () =>  {
        var azure = new AzureCloudStorageService(options);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.listContainers(path)
            .then((result) => {
                expect(result).toBe(containers)
            })
        expect(FakeBlobService.listContainersSegmented).toBeCalledWith(
            null,
            expect.any(Function)
        );
    })

    it("Create container", () =>  {
        var azure = new AzureCloudStorageService(options);
        azure.getService = jest.fn(() => FakeBlobService);
        azure.createContainer(path);
        expect(FakeBlobService.createContainerIfNotExists).toBeCalledWith(
            containerName,
            { publicAccessLevel: 'blob' },
            expect.any(Function)
        );
    })
    
})
