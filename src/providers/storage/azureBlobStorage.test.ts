import MockFactory from "../../common/mockFactory";
import registerProviders from "../../registerProviders";
import { AzureBlobStorage } from "./azureBlobStorage";
jest.mock("@azure/storage-blob");
import { BlockBlobURL, ContainerURL, ServiceURL, Aborter } from "@azure/storage-blob";
jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";
import { AssetType } from "../../models/applicationState";

describe("Azure blob functions", () => {

    const globalCloudRoot = `https://account.blob.core.windows.net`;
    const chinacCloudRoot = `https://blob.core.chinacloudapi.cn`;

    const azureData = MockFactory.createAzureData();
    const optionsForGlobalBlob = azureData.options;
    optionsForGlobalBlob.blobEndpoint = globalCloudRoot; // may not be used if using sas
    const optionsForChinaBlob = azureData.options;
    optionsForChinaBlob.blobEndpoint = chinacCloudRoot;

    const serviceURL = ServiceURL as jest.Mocked<typeof ServiceURL>;
    serviceURL.prototype.listContainersSegment = jest.fn(() => Promise.resolve(azureData.containers));

    ContainerURL.fromServiceURL = jest.fn(() => new ContainerURL(null, null));
    const containerURL = ContainerURL as jest.Mocked<typeof ContainerURL>;
    containerURL.prototype.create = jest.fn(() => Promise.resolve({ statusCode: 201 }));
    containerURL.prototype.delete = jest.fn(() => Promise.resolve({ statusCode: 204 }));
    containerURL.prototype.listBlobFlatSegment = jest.fn(() => Promise.resolve(azureData.blobs));

    BlockBlobURL.fromContainerURL = jest.fn(() => new BlockBlobURL(null, null));

    registerProviders();

    it("Reads text from a blob", async () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;

        const blob = MockFactory.blob(azureData.blobName, azureData.blobText, azureData.fileType);
        blockBlobURL.prototype.download = jest.fn(() => Promise.resolve({
            blobBody: Promise.resolve(blob),
        }));

        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);

        const content = await provider.readText(azureData.blobName);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            azureData.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            azureData.blobName,
        );
        expect(content).toEqual(azureData.blobText);
    });

    it("Reads buffer from a blob", async () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;

        const blob = MockFactory.blob(
            azureData.blobName, Buffer.from(azureData.blobText), azureData.fileType,
        );
        blockBlobURL.prototype.download = jest.fn(() => Promise.resolve({
            blobBody: Promise.resolve(blob),
        }));

        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);

        const content = await provider.readBinary(azureData.blobName);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            azureData.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            azureData.blobName,
        );
        expect(content).toEqual(Buffer.from(azureData.blobText));
    });

    it("Writes text to a blob", () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;
        const blob = MockFactory.blob(azureData.blobName, azureData.blobText, azureData.fileType);
        blockBlobURL.prototype.download = jest.fn(() => Promise.resolve({
            blobBody: Promise.resolve(blob),
        }));

        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);

        provider.writeText(azureData.blobName, azureData.blobText);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            azureData.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            azureData.blobName,
        );
        expect(blockBlobURL.prototype.upload).toBeCalledWith(
            Aborter.none,
            azureData.blobText,
            azureData.blobText.length,
        );
    });

    it("Writes a buffer to a blob", () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;

        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);

        provider.writeText(azureData.blobName, Buffer.from(azureData.blobText));
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            azureData.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            azureData.blobName,
        );
        expect(blockBlobURL.prototype.upload).toBeCalledWith(
            Aborter.none,
            Buffer.from(azureData.blobText),
            azureData.blobText.length,
        );
    });

    it("Lists the blobs within a container", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);
        const blobs = await provider.listFiles(null);
        expect(containerURL.prototype.listBlobFlatSegment).toBeCalled();
        expect(blobs).toEqual(azureData.blobs.segment.blobItems.map((element) => element.name));
    });

    it("Deletes a blob within a container", async () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;

        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);

        provider.deleteFile(azureData.blobName);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            azureData.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            azureData.blobName,
        );
        expect(blockBlobURL.prototype.delete).toBeCalledWith(Aborter.none);
    });

    it("Lists the containers within an account", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);
        const containers = await provider.listContainers(null);
        expect(serviceURL.prototype.listContainersSegment).toBeCalled();
        expect(containers).toEqual(azureData.containers.containerItems.map((element) => element.name));
    });

    it("Creates a container in the account", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);
        await expect(provider.createContainer(null)).resolves.not.toBeNull();
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            azureData.containerName,
        );
        expect(containerURL.prototype.create).toBeCalled();
    });

    it("Creates a container that already exists", async () => {
        containerURL.prototype.create = jest.fn(() => {
            return Promise.reject({ statusCode: 409 });
        });

        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);
        await expect(provider.createContainer(null)).resolves.not.toBeNull();
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            azureData.containerName,
        );
        expect(containerURL.prototype.create).toBeCalled();
    });

    it("Deletes a container in the account", () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);
        provider.deleteContainer(null);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            azureData.containerName,
        );
        expect(containerURL.prototype.delete).toBeCalled();
    });

    it("getAssets", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);
        AssetService.createAssetFromFilePath = jest.fn(() => {
            return {
                type: AssetType.Image,
            };
        });
        provider.getFileName = jest.fn();
        const assets = await provider.getAssets();
        expect(provider.getFileName).toBeCalled();
        expect(assets).toHaveLength(azureData.blobs.segment.blobItems.length);
    });

    it.each([globalCloudRoot, chinacCloudRoot])("get file name from non global url", async (path) => {
        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);
        const url =  `${path}/container/filename.jpg?aBcDeFGHiJkLMnoP`;
        const fileName = provider.getFileName(url);
        expect(fileName).toEqual("filename.jpg");
    });

    it("creates a container when specified in options", () => {
        const newOptions = {
            ...optionsForGlobalBlob,
            containerName: "newContainer",
            createContainer: true,
        };
        const provider: AzureBlobStorage = new AzureBlobStorage(newOptions);

        provider.initialize();
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            newOptions.containerName,
        );
    });

    it("does not create a container when not specified", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(optionsForGlobalBlob);
        await provider.initialize();
        expect(serviceURL.prototype.listContainersSegment).toBeCalled();
    });

    it("throws an error if container not found and not created", async () => {
        const newContainerName = "newContainer";
        const provider: AzureBlobStorage = new AzureBlobStorage({
            ...optionsForGlobalBlob,
            containerName: newContainerName,
        });
        try {
            await provider.initialize();
        } catch (e) {
            expect(e.message).toEqual(`Container "${newContainerName}" does not exist`);
        }
    });
});
