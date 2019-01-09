import { AssetProviderFactory, IAssetProvider } from "./assetProviderFactory";
import { IAsset } from "../../models/applicationState";

describe("Asset Provider Factory", () => {
    it("registers new storage providers", () => {
        expect(Object.keys(AssetProviderFactory.providers).length).toEqual(0);
        AssetProviderFactory.register("testProvider", () => new TestAssetProvider());
        expect(Object.keys(AssetProviderFactory.providers).length).toEqual(1);
    });

    it("creates a new instance of the provider", () => {
        AssetProviderFactory.register("testProvider", () => new TestAssetProvider());
        const provider = AssetProviderFactory.create("testProvider");

        expect(provider).not.toBeNull();
        expect(provider).toBeInstanceOf(TestAssetProvider);
    });

    it("throws error if provider is not found", () => {
        expect(() => AssetProviderFactory.create("unknown")).toThrowError();
    });
});

class TestAssetProvider implements IAssetProvider {
    public initialize(): Promise<void> {
        throw new Error("Method not implemented");
    }
    public getAssets(containerName?: string): Promise<IAsset[]> {
        throw new Error("Method not implemented.");
    }
}
