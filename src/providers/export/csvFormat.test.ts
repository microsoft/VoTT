import _ from "lodash";
import { CSVFormatExportProvider } from "./csvFormat";
import registerProviders from "../../registerProviders";
import { ExportAssetState } from "./exportProvider";
import { ExportProviderFactory } from "./exportProviderFactory";
import { IProject, IAssetMetadata, AssetState, IExportProviderOptions,
    RegionType } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import registerMixins from "../../registerMixins";
import HtmlFileReader from "../../common/htmlFileReader";
import { appInfo } from "../../common/appInfo";
import { AssetProviderFactory } from "../storage/assetProviderFactory";

registerMixins();

describe("CSV Format Export Provider", () => {
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
            providerType: "csvFormat",
            providerOptions: {
                assetState: ExportAssetState.All,
            },
        },
    };

    const expectedFileName = "vott-csv-export/" + testProject.name.replace(" ", "-") + "-export.csv";

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
        expect(CSVFormatExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const options: IExportProviderOptions = {
            assetState: ExportAssetState.All,
        };
        const exportProvider = ExportProviderFactory.create("csvFormat", testProject, options);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(CSVFormatExportProvider);
    });

    describe("Export variations", () => {
        beforeEach(() => {
            const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
            assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
                const assetMetadata: IAssetMetadata = {
                    asset,
                    regions: [
                        {
                            id: "1",
                            type: RegionType.Rectangle,
                            tags: ["a", "b"],
                            boundingBox: {
                                left: 1,
                                top: 2,
                                width: 3,
                                height: 4,
                            },
                        },
                    ],
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
            const options: IExportProviderOptions = {
                assetState: ExportAssetState.All,
            };

            const exportProvider = new CSVFormatExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportCsv = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const records = exportCsv.split("\n");

            // 10 assets - Each with 1 region and 2 tags
            expect(records.length).toEqual(20);

            expect(LocalFileSystemProxy.prototype.writeText)
                .toBeCalledWith(expectedFileName, expect.any(String));
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: IExportProviderOptions = {
                assetState: ExportAssetState.Visited,
            };

            const exportProvider = new CSVFormatExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportCsv = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const records = exportCsv.split("\n");

            // 2 tagged / 1 visited assets - Each with 1 region and 2 tags
            expect(records.length).toEqual(6);
        });

        it("Exports only tagged assets", async () => {
            const options: IExportProviderOptions = {
                assetState: ExportAssetState.Tagged,
            };

            const exportProvider = new CSVFormatExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const exportCsv = storageProviderMock.mock.instances[0].writeText.mock.calls[0][1];
            const records = exportCsv.split("\n");

            // 2 tagged - Each with 1 region and 2 tags
            expect(records.length).toEqual(4);
        });
    });
});
