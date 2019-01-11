describe("Register Providers", () => {

    beforeEach(() => {
        jest.resetModules();
    });

    describe("Browser Registration", () => {
        afterEach(() => {
            process.env.TEST = "true";
        });

        it("Doesn't Register localFileSystemProxy", () => {
            process.env.TEST = "false";

            jest.mock("os", () => {
                return {
                    release: () => "browser",
                };
            });

            const registerProviders = require("./registerProviders").default;
            registerProviders();

            const storageProviderFactory = require("./providers/storage/storageProviderFactory").StorageProviderFactory;
            const assetProviderFactory = require("./providers/storage/assetProviderFactory").AssetProviderFactory;

            expect(storageProviderFactory.providers["localFileSystemProxy"]).toBeUndefined();
            expect(assetProviderFactory.providers["localFileSystemProxy"]).toBeUndefined();
        });
    });

    describe("Electron Registration", () => {
        it("Does Register localFileSystemProxy", () => {
            jest.mock("os", () => {
                return {
                    release: () => "electron",
                };
            });

            const registerProviders = require("./registerProviders").default;
            registerProviders();

            const storageProviderFactory = require("./providers/storage/storageProviderFactory").StorageProviderFactory;
            const assetProviderFactory = require("./providers/storage/assetProviderFactory").AssetProviderFactory;

            expect(storageProviderFactory.providers["localFileSystemProxy"]).toBeTruthy();
            expect(assetProviderFactory.providers["localFileSystemProxy"]).toBeTruthy();
        });
    });
});
