import _ from "lodash";
import { VottJsonExportProvider, IVottJsonExportProviderOptions } from "./vottJson";
import registerProviders from "../../registerProviders";
import { ExportAssetState } from "./exportProvider";
import { ExportProviderFactory } from "./exportProviderFactory";
import { IProject, IAssetMetadata, AssetState, EditorContext } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import { constants } from "../../common/constants";
import registerMixins from "../../registerMixins";
import HtmlFileReader from "../../common/htmlFileReader";
import { appInfo } from "../../common/appInfo";
import { AssetProviderFactory } from "../storage/assetProviderFactory";

registerMixins();

describe("VoTT Json Export Provider", () => {
    const testAssets = MockFactory.createTestAssets(10, 1);
    const testProject: IProject = {
        ...MockFactory.createTestProject(),
        assets: {
            "asset-1": MockFactory.createTestAsset("1", AssetState.Tagged),
            "asset-2": MockFactory.createTestAsset("2", AssetState.Tagged),
            "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
            "asset-4": MockFactory.createTestAsset("4", AssetState.NotVisited),
        },
        exportFormat: {
            providerType: "json",
            providerOptions: {
                assetState: ExportAssetState.All,
            },
        },
    };

    const expectedFileName = "vott-json-export/" + testProject.name.replace(" ", "-") + constants.exportFileExtension;

    beforeAll(() => {
        HtmlFileReader.getAssetBlob = jest.fn(() => {
            return Promise.resolve(new Blob(["Some binary data"]));
        });

        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });
    });

    beforeEach(() => {
        registerProviders();
    });

    it("Is defined", () => {
        expect(VottJsonExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const options: IVottJsonExportProviderOptions = {
            assetState: ExportAssetState.All,
            includeImages: true,
        };
        const exportProvider = ExportProviderFactory.create("vottJson", testProject, options);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(VottJsonExportProvider);
    });

    describe("Export variations", () => {
        beforeEach(() => {
            const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
            assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
                const assetMetadata: IAssetMetadata = {
                    asset,
                    regions: [],
                    segments: [],
                    version: appInfo.version,
                };

                return Promise.resolve(assetMetadata);
            });

            const storageProviderMock = LocalFileSystemProxy as jest.Mock<LocalFileSystemProxy>;
            storageProviderMock.prototype.writeText.mockClear();
            storageProviderMock.prototype.writeBinary.mockClear();
            storageProviderMock.mockClear();
        });

        it("Exports all assets", async () => {
            const options: IVottJsonExportProviderOptions = {
                assetState: ExportAssetState.All,
                includeImages: true,
            };

            const exportProvider = new VottJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportJson = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const exportObject = JSON.parse(exportJson) as IProject;

            const exportedAssets = _.values(exportObject.assets);

            // Ensure provider information not included in export JSON
            expect(exportObject.sourceConnection).toBeUndefined();
            expect(exportObject.targetConnection).toBeUndefined();
            expect(exportObject.exportFormat).toBeUndefined();

            // Verify exported assets match expectations
            expect(exportedAssets.length).toEqual(testAssets.length);
            expect(LocalFileSystemProxy.prototype.writeText)
                .toBeCalledWith(expectedFileName, expect.any(String));
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: IVottJsonExportProviderOptions = {
                assetState: ExportAssetState.Visited,
                includeImages: true,
            };

            const exportProvider = new VottJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportJson = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const exportObject = JSON.parse(exportJson);

            ////////////////////////////////////////////////////////////////
            // WARNING: should be updated
            const exportedAssets = _.values(exportObject.assets);
            const expectedAssets = _.values(testProject.assets)
                .filter((asset) => asset.state[EditorContext.Geometry] === AssetState.Visited || asset.state[EditorContext.Geometry] === AssetState.Tagged);

            // Ensure provider information not included in export JSON
            expect(exportObject.sourceConnection).toBeUndefined();
            expect(exportObject.targetConnection).toBeUndefined();
            expect(exportObject.exportFormat).toBeUndefined();

            // Verify exported assets match expectations
            expect(exportedAssets.length).toEqual(expectedAssets.length);
            expect(LocalFileSystemProxy.prototype.writeText)
                .toBeCalledWith(expectedFileName, expect.any(String));
        });

        it("Exports only tagged assets", async () => {
            const options: IVottJsonExportProviderOptions = {
                assetState: ExportAssetState.Tagged,
                includeImages: true,
            };

            const exportProvider = new VottJsonExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportJson = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const exportObject = JSON.parse(exportJson);

            const exportedAssets = _.values(exportObject.assets);
            const expectedAssets = _.values(testProject.assets).filter((asset) => asset.state[EditorContext.Geometry] === AssetState.Tagged);

            // Ensure provider information not included in export JSON
            expect(exportObject.sourceConnection).toBeUndefined();
            expect(exportObject.targetConnection).toBeUndefined();
            expect(exportObject.exportFormat).toBeUndefined();

            // Verify exported assets match expectations
            expect(exportedAssets.length).toEqual(expectedAssets.length);
            expect(LocalFileSystemProxy.prototype.writeText)
                .toBeCalledWith(expectedFileName, expect.any(String));
        });

        it("Includes images in export when option is selected", async () => {
            const options: IVottJsonExportProviderOptions = {
                assetState: ExportAssetState.All,
                includeImages: true,
            };

            const exportProvider = new VottJsonExportProvider(testProject, options);
            await exportProvider.export();

            expect(LocalFileSystemProxy.prototype.writeText).toBeCalledTimes(1);
            expect(LocalFileSystemProxy.prototype.writeBinary).toBeCalledTimes(testAssets.length);
        });

        it("Does not include images in export when option is not selected", async () => {
            const options: IVottJsonExportProviderOptions = {
                assetState: ExportAssetState.All,
                includeImages: false,
            };

            const exportProvider = new VottJsonExportProvider(testProject, options);
            await exportProvider.export();

            expect(LocalFileSystemProxy.prototype.writeText).toBeCalledTimes(1);
            expect(LocalFileSystemProxy.prototype.writeBinary).toBeCalledTimes(0);
        });
    });
});
