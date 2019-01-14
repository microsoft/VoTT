import registerProviders from "./registerProviders";
import { StorageProviderFactory } from "./providers/storage/storageProviderFactory";
import { AssetProviderFactory } from "./providers/storage/assetProviderFactory";

jest.mock("./common/hostProcess");
import getHostProcess, { HostProcessType } from "./common/hostProcess";

const hostProcess = getHostProcess();

describe("Register Providers", () => {
    describe("Browser Registration", () => {
        it("Doesn't Register localFileSystemProxy", () => {
            const getHostProcessMock = getHostProcess as jest.Mock;
            getHostProcessMock.mockImplementation(() => {
                return {
                    type: HostProcessType.Browser,
                    release: "browser",
                };
            });

            registerProviders();

            expect(StorageProviderFactory.providers["localFileSystemProxy"]).toBeUndefined();
            expect(AssetProviderFactory.providers["localFileSystemProxy"]).toBeUndefined();
        });
    });

    describe("Electron Registration", () => {
        it("Does Register localFileSystemProxy", () => {
            const getHostProcessMock = getHostProcess as jest.Mock;
            getHostProcessMock.mockImplementation(() => {
                return {
                    type: HostProcessType.Electron,
                    release: "electron",
                };
            });

            registerProviders();

            expect(StorageProviderFactory.providers["localFileSystemProxy"]).toBeTruthy();
            expect(AssetProviderFactory.providers["localFileSystemProxy"]).toBeTruthy();
        });
    });
});
