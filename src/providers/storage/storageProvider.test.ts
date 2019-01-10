import { StorageProviderFactory, IStorageProvider } from "./storageProviderFactory";
import { IAsset, StorageType } from "../../models/applicationState";

describe("Storage Provider Factory", () => {
    it("registers new storage providers", () => {
        expect(Object.keys(StorageProviderFactory.providers).length).toEqual(0);
        StorageProviderFactory.register("testProvider", () => new TestStorageProvider());
        expect(Object.keys(StorageProviderFactory.providers).length).toEqual(1);
    });

    it("creates a new instance of the provider", () => {
        StorageProviderFactory.register("testProvider", () => new TestStorageProvider());
        const provider = StorageProviderFactory.create("testProvider");

        expect(provider).not.toBeNull();
        expect(provider).toBeInstanceOf(TestStorageProvider);
    });

    it("throws error if provider is not found", () => {
        expect(() => StorageProviderFactory.create("unknown")).toThrowError();
    });
});

class TestStorageProvider implements IStorageProvider {
    public storageType: StorageType.Other;

    public readText(filePath: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
    public readBinary(filePath: string): Promise<Buffer> {
        throw new Error("Method not implemented.");
    }
    public deleteFile(filePath: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public writeText(filePath: string, contents: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public writeBinary(filePath: string, contents: Buffer): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public listFiles(folderPath?: string): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    public listContainers(folderPath?: string): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    public createContainer(folderPath: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public deleteContainer(folderPath: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public getAssets(containerName?: string): Promise<IAsset[]> {
        throw new Error("Method not implemented.");
    }
}
