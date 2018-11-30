// import * as AzureStorageBlob from './azurestoragejs/azure-storage.blob.js'
import AzureStorageBlob from "../../vendor/azurestoragejs/azure-storage.blob.js";
import { AzureCloudStorageService, IAzureCloudStorageOptions } from "./azureBlobStorage";
import { StorageProviderFactory, IStorageProvider } from "./storageProvider";

const content = "This is the content";
const containers = ["container1", "container2", "container3"];
const files = ["file1.txt", "file2.txt", "file3.txt"];
const path = "container/filename.txt";
const containerName = "container";
const fileName = "filename.txt";

class FakeBlobService {

    public static getBlobToText = jest.fn(() => Promise.resolve(content));
    public static deleteBlobIfExists = jest.fn(() => Promise.resolve());
    public static createBlockBlobFromText = jest.fn(() => Promise.resolve());
    public static createContainerIfNotExists = jest.fn(() => Promise.resolve());
    public static listBlobsSegmented = jest.fn(() => Promise.resolve(files));
    public static listContainersSegmented = jest.fn(() => Promise.resolve(containers));
    public static deleteContainer = jest.fn(() => Promise.resolve());
}

describe("Azure blob functions", () => {

    let provider: AzureCloudStorageService = null;
    const options: IAzureCloudStorageOptions = {
        connectionString: "fake connection string",
    };

    describe("Initializing Connection", () => {
        it("Create blob service", () =>  {
            AzureStorageBlob.createBlobService = jest.fn(() => Promise.resolve());
            const azure = new AzureCloudStorageService(options);
            azure.listContainers(null);
            expect(AzureStorageBlob.createBlobService).toBeCalledWith(options.connectionString);
        });
    });

    describe("After connection is initialized", () => {

        beforeEach(() => {
            provider = new AzureCloudStorageService(options);
            provider.getService = jest.fn(() => FakeBlobService);
        });

        it("Provider is registered with the StorageProviderFactory", () => {
            const storageProvider = StorageProviderFactory.create("azureBlobStorage", options);
            expect(storageProvider).not.toBeNull();
        });

        it("Get Blob to Text", () =>  {
            provider.readText(path)
                .then((text) => {
                    expect(text).toBe(content);
                });
            expect(FakeBlobService.getBlobToText).toBeCalledWith(
                containerName,
                fileName,
                expect.any(Function),
            );
        });

        it("Get Blob to Binary", () =>  {
            // Skipping for now
        });

        it("Write text", () =>  {
            provider.writeText(path, content);
            expect(FakeBlobService.createBlockBlobFromText).toBeCalledWith(
                containerName,
                fileName,
                content,
                expect.any(Function),
            );
        });

        it("Write binary", () =>  {
            // Skipping for now, but 'createBlockBlobFromText' also takes a buffer
        });

        it("Delete file", () =>  {
            provider.deleteFile(path);
            expect(FakeBlobService.deleteBlobIfExists).toBeCalledWith(
                containerName,
                fileName,
                expect.any(Function),
            );
        });

        it("List files", () =>  {
            provider.listFiles(path)
                .then((result) => {
                    expect(result).toBe(files);
                });
            expect(FakeBlobService.listBlobsSegmented).toBeCalledWith(
                containerName,
                expect.any(Function),
            );
        });

        it("List containers", () =>  {
            provider.listContainers(path)
                .then((result) => {
                    expect(result).toBe(containers);
                });
            expect(FakeBlobService.listContainersSegmented).toBeCalledWith(
                null,
                expect.any(Function),
            );
        });

        it("Create container", () =>  {
            provider.createContainer(path);
            expect(FakeBlobService.createContainerIfNotExists).toBeCalledWith(
                containerName,
                { publicAccessLevel: "blob" },
                expect.any(Function),
            );
        });
    });

});
