import _ from "lodash";
import { CntkExportProvider, ICntkExportProviderOptions } from "./cntk";
import { IProject, AssetState } from "../../models/applicationState";
import { AssetProviderFactory } from "../storage/assetProviderFactory";
import { ExportAssetState } from "./exportProvider";
import MockFactory from "../../common/mockFactory";
import registerMixins from "../../registerMixins";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import HtmlFileReader from "../../common/htmlFileReader";
import { appInfo } from "../../common/appInfo";

describe("CNTK Export Provider", () => {
    const testAssets = MockFactory.createTestAssets(10, 1);
    let testProject: IProject = null;

    const defaultOptions: ICntkExportProviderOptions = {
        assetState: ExportAssetState.Tagged,
        testTrainSplit: 80,
    };

    function createProvider(project: IProject): CntkExportProvider {
        return new CntkExportProvider(
            project,
            project.exportFormat.providerOptions as ICntkExportProviderOptions,
        );
    }

    beforeAll(() => {
        registerMixins();
        registerProviders();

        HtmlFileReader.getAssetBlob = jest.fn(() => {
            return Promise.resolve(new Blob(["Some binary data"]));
        });
    });

    beforeEach(() => {
        jest.resetAllMocks();

        testAssets.forEach((asset) => {
            asset.state = AssetState.Tagged;
        });

        testProject = {
            ...MockFactory.createTestProject("TestProject"),
            assets: _.keyBy(testAssets, (a) => a.id),
            exportFormat: {
                providerType: "cntk",
                providerOptions: defaultOptions,
            },
        };

        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });

        const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata = {
                asset: { ...asset },
                regions: [
                    MockFactory.createTestRegion("region-1", ["tag1"]),
                    MockFactory.createTestRegion("region-2", ["tag1"]),
                ],
                version: appInfo.version,
            };

            return Promise.resolve(assetMetadata);
        });
    });

    it("Is defined", () => {
        expect(CntkExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const options: ICntkExportProviderOptions = {
            assetState: ExportAssetState.All,
            testTrainSplit: 80,
        };
        const exportProvider = ExportProviderFactory.create("cntk", testProject, options);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(CntkExportProvider);
    });

    it("Creates correct folder structure", async () => {
        const provider = createProvider(testProject);
        await provider.export();

        const storageProviderMock = LocalFileSystemProxy as any;
        const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;
        const createContainerArgs = createContainerCalls.map((args) => args[0]);

        const expectedFolderPath = "Project-TestProject-CNTK-export";
        expect(createContainerArgs).toContain(expectedFolderPath);
        expect(createContainerArgs).toContain(`${expectedFolderPath}/positive`);
        expect(createContainerArgs).toContain(`${expectedFolderPath}/negative`);
        expect(createContainerArgs).toContain(`${expectedFolderPath}/testImages`);
    });

    it("Writes export files to storage provider", async () => {
        const provider = createProvider(testProject);
        await provider.export();

        const storageProviderMock = LocalFileSystemProxy as any;
        const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
        const writeBinaryFilenameArgs = writeBinaryCalls.map((args) => args[0]);
        const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
        const writeTextFilenameArgs = writeTextFileCalls.map((args) => args[0]);
        const writeTextDataArgs = writeTextFileCalls.map((args) => args[1]);

        expect(writeBinaryCalls).toHaveLength(testAssets.length);
        expect(writeTextFileCalls).toHaveLength(testAssets.length * 2);

        testAssets.forEach((asset) => {
            expect(writeBinaryFilenameArgs.find((a: string) => a.includes(asset.name)))
                .not.toBeNull();
            expect(writeTextFilenameArgs.find((a: string) => a.includes(`${asset.name}.bboxes.labels.tsv`)))
                .not.toBeNull();
            expect(writeTextFilenameArgs.find((a: string) => a.includes(`${asset.name}.bboxes.tsv`)))
                .not.toBeNull();
        });
    });
});
