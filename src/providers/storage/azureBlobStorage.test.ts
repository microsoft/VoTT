import MockFactory from "../../common/mockFactory";
import registerProviders from "../../registerProviders";
import { AzureBlobStorage } from "./azureBlobStorage";
jest.mock("@azure/storage-blob");
import { BlockBlobURL, ContainerURL, ServiceURL, Aborter } from "@azure/storage-blob";
jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";
import { AssetType } from "../../models/applicationState";

describe("Azure blob functions", () => {

    const ad = MockFactory.fakeAzureData();
    const options = ad.options;
    

    const serviceURL = ServiceURL as jest.Mocked<typeof ServiceURL>;
    serviceURL.prototype.listContainersSegment = jest.fn(() => Promise.resolve(ad.containers));

    ContainerURL.fromServiceURL = jest.fn(() => new ContainerURL(null, null));
    const containerURL = ContainerURL as jest.Mocked<typeof ContainerURL>;
    containerURL.prototype.delete = jest.fn(() => Promise.resolve());
    containerURL.prototype.listBlobFlatSegment = jest.fn(() => Promise.resolve(ad.blobs));

    BlockBlobURL.fromContainerURL = jest.fn(() => new BlockBlobURL(null, null));

    registerProviders();

    it("Reads text from a blob", async () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;

        const blob = MockFactory.blob(ad.blobName, ad.blobText, ad.fileType);
        blockBlobURL.prototype.download = jest.fn(() => Promise.resolve({
            blobBody: Promise.resolve(blob),
        }));

        const provider: AzureBlobStorage = new AzureBlobStorage(options);

        const content = await provider.readText(ad.blobName);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            ad.blobName,
        );
        expect(content).toEqual(ad.blobText);
    });

    it("Reads buffer from a blob", async () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;

        const blob = MockFactory.blob(
            ad.blobName, Buffer.from(ad.blobText), ad.fileType,
        );
        blockBlobURL.prototype.download = jest.fn(() => Promise.resolve({
            blobBody: Promise.resolve(blob),
        }));

        const provider: AzureBlobStorage = new AzureBlobStorage(options);

        const content = await provider.readBinary(ad.blobName);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            ad.blobName,
        );
        expect(content).toEqual(Buffer.from(ad.blobText));
    });

    it("Writes text to a blob", () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;
        const blob = MockFactory.blob(ad.blobName, ad.blobText, ad.fileType);
        blockBlobURL.prototype.download = jest.fn(() => Promise.resolve({
            blobBody: Promise.resolve(blob),
        }));

        const provider: AzureBlobStorage = new AzureBlobStorage(options);

        provider.writeText(ad.blobName, ad.blobText);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            ad.blobName,
        );
        expect(blockBlobURL.prototype.upload).toBeCalledWith(
            Aborter.none,
            ad.blobText,
            ad.blobText.length,
        );
    });

    it("Writes a buffer to a blob", () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;

        const provider: AzureBlobStorage = new AzureBlobStorage(options);

        provider.writeText(ad.blobName, Buffer.from(ad.blobText));
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            ad.blobName,
        );
        expect(blockBlobURL.prototype.upload).toBeCalledWith(
            Aborter.none,
            Buffer.from(ad.blobText),
            ad.blobText.length,
        );
    });

    it("Lists the blobs within a container", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(options);
        const blobs = await provider.listFiles(null);
        expect(containerURL.prototype.listBlobFlatSegment).toBeCalled();
        expect(blobs).toEqual(ad.blobs.segment.blobItems.map((element) => element.name));
    });

    it("Deletes a blob within a container", async () => {
        const blockBlobURL = BlockBlobURL as jest.Mocked<typeof BlockBlobURL>;

        const provider: AzureBlobStorage = new AzureBlobStorage(options);

        provider.deleteFile(ad.blobName);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(BlockBlobURL.fromContainerURL).toBeCalledWith(
            expect.any(ContainerURL),
            ad.blobName,
        );
        expect(blockBlobURL.prototype.delete).toBeCalledWith(Aborter.none);
    });

    it("Lists the containers within an account", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(options);
        const containers = await provider.listContainers(null);
        expect(serviceURL.prototype.listContainersSegment).toBeCalled();
        expect(containers).toEqual(ad.containers.containerItems.map((element) => element.name));
    });

    it("Creates a container in the account", () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(options);
        const container = provider.createContainer(null);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(containerURL.prototype.create).toBeCalled();
    });

    it("Deletes a container in the account", () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(options);
        provider.deleteContainer(null);
        expect(ContainerURL.fromServiceURL).toBeCalledWith(
            expect.any(ServiceURL),
            ad.containerName,
        );
        expect(containerURL.prototype.delete).toBeCalled();
    });

    it("getAssets", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(options);
        AssetService.createAssetFromFilePath = jest.fn(() => {
            return {
                type: AssetType.Image,
            };
        });
        provider.getFileName = jest.fn();
        const assets = await provider.getAssets();
        expect(provider.getFileName).toBeCalled();
        expect(assets).toHaveLength(ad.blobs.segment.blobItems.length);
    });

    it("get file name from url", async () => {
        const provider: AzureBlobStorage = new AzureBlobStorage(options);
        const url = "https://account.blob.core.windows.net/container/filename.jpg?aBcDeFGHiJkLMnoP";
        const fileName = provider.getFileName(url);
        expect(fileName).toEqual("filename.jpg");
    });

});
