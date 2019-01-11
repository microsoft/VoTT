import registerProviders from "./registerProviders";
import { StorageProviderFactory } from "./providers/storage/storageProviderFactory";
import { AssetProviderFactory } from "./providers/storage/assetProviderFactory";
import hostProcess from "./common/hostProcess";

describe("Register Providers", () => {

    describe("Browser Registration", () => {
        it("Doesn't Register localFileSystemProxy", () => {
            hostProcess.type = 2;

            registerProviders();

            expect(StorageProviderFactory.providers["localFileSystemProxy"]).toBeUndefined();
            expect(AssetProviderFactory.providers["localFileSystemProxy"]).toBeUndefined();
        });
    });

    describe("Electron Registration", () => {
        it("Does Register localFileSystemProxy", () => {
            hostProcess.type = 1;

            registerProviders();

            expect(StorageProviderFactory.providers["localFileSystemProxy"]).toBeTruthy();
            expect(AssetProviderFactory.providers["localFileSystemProxy"]).toBeTruthy();
        });
    });
});
