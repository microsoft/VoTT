import { MetadataProviderFactory, IMetadataProvider } from "./MetadataProviderFactory";
import { IMetadata } from "../../models/applicationState";

describe("Metadata Provider Factory", () => {
    it("registers new storage providers", () => {
        expect(Object.keys(MetadataProviderFactory.providers).length).toEqual(0);
        MetadataProviderFactory.register("testProvider", () => new TestMetadataProvider());
        expect(Object.keys(MetadataProviderFactory.providers).length).toEqual(1);
    });

    it("creates a new instance of the provider", () => {
        MetadataProviderFactory.register("testProvider", () => new TestMetadataProvider());
        const provider = MetadataProviderFactory.create("testProvider");

        expect(provider).not.toBeNull();
        expect(provider).toBeInstanceOf(TestMetadataProvider);
    });

    it("throws error if provider is not found", () => {
        expect(() => MetadataProviderFactory.create("unknown")).toThrowError();
    });
});

class TestMetadataProvider implements IMetadataProvider {
    public initialize(): Promise<void> {
        throw new Error("Method not implemented");
    }
    public getMetadatas(): Promise<IMetadata[]> {
        throw new Error("Method not implemented.");
    }
}
