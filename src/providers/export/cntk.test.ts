import _ from "lodash";
import os from "os";
import { CntkExportProvider, ICntkExportProviderOptions } from "./cntk";
import { IProject, AssetState, IAssetMetadata } from "../../models/applicationState";
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
        const getAssetsSpy = jest.spyOn(provider, "getAssetsForExport");

        await provider.export();

        const assetsToExport = await getAssetsSpy.mock.results[0].value;
        const testSplit = (100 - (defaultOptions.testTrainSplit || 80)) / 100;

        const trainArray = [];
        const testArray = [];
        const tagsAssestList: {
            [index: string]: {
                assetSet: Set<string>,
                testArray: string[],
                trainArray: string[],
            },
        } = {};
        testProject.tags.forEach((tag) =>
            tagsAssestList[tag.name] = {
                assetSet: new Set(), testArray: [],
                trainArray: [],
            });
        assetsToExport.forEach((assetMetadata) => {
            assetMetadata.regions.forEach((region) => {
                region.tags.forEach((tagName) => {
                    if (tagsAssestList[tagName]) {
                        tagsAssestList[tagName].assetSet.add(assetMetadata.asset.name);
                    }
                });
            });
        });

        for (const tagKey of Object.keys(tagsAssestList)) {
            const assetSet = tagsAssestList[tagKey].assetSet;
            const testCount = Math.ceil(assetSet.size * testSplit);
            testArray.push(...Array.from(assetSet).slice(0, testCount));
            trainArray.push(...Array.from(assetSet).slice(testCount, assetSet.size));
        }

        const storageProviderMock = LocalFileSystemProxy as any;
        const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
        const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;

        expect(writeBinaryCalls).toHaveLength(testAssets.length);
        expect(writeTextFileCalls).toHaveLength(testAssets.length * 2);

        testArray.forEach((assetMetadata) => {
            const testFolderPath = "Project-TestProject-CNTK-export/testImages";
            assertExportedAsset(testFolderPath, assetMetadata);
        });

        trainArray.forEach((assetMetadata) => {
            const trainFolderPath = "Project-TestProject-CNTK-export/positive";
            assertExportedAsset(trainFolderPath, assetMetadata);
        });
    });

    function assertExportedAsset(folderPath: string, assetMetadata: IAssetMetadata) {
        const storageProviderMock = LocalFileSystemProxy as any;
        const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
        const writeBinaryFilenameArgs = writeBinaryCalls.map((args) => args[0]);
        const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
        const writeTextFilenameArgs = writeTextFileCalls.map((args) => args[0]);

        expect(writeBinaryFilenameArgs).toContain(`${folderPath}/${assetMetadata.asset.name}`);
        expect(writeTextFilenameArgs).toContain(`${folderPath}/${assetMetadata.asset.name}.bboxes.labels.tsv`);
        expect(writeTextFilenameArgs).toContain(`${folderPath}/${assetMetadata.asset.name}.bboxes.tsv`);

        const writeLabelsCall = writeTextFileCalls
            .find((args: string[]) => args[0].indexOf(`${assetMetadata.asset.name}.bboxes.labels.tsv`) >= 0);

        const writeBoxesCall = writeTextFileCalls
            .find((args: string[]) => args[0].indexOf(`${assetMetadata.asset.name}.bboxes.tsv`) >= 0);

        const expectedLabelData = `${assetMetadata.regions[0].tags[0]}${os.EOL}${assetMetadata.regions[1].tags[0]}`;
        expect(writeLabelsCall[1]).toEqual(expectedLabelData);

        const expectedBoxData = [];
        // tslint:disable-next-line:max-line-length
        expectedBoxData.push(`${assetMetadata.regions[0].boundingBox.left}\t${assetMetadata.regions[0].boundingBox.left + assetMetadata.regions[0].boundingBox.width}\t${assetMetadata.regions[0].boundingBox.top}\t${assetMetadata.regions[0].boundingBox.top + assetMetadata.regions[0].boundingBox.height}`);
        // tslint:disable-next-line:max-line-length
        expectedBoxData.push(`${assetMetadata.regions[1].boundingBox.left}\t${assetMetadata.regions[1].boundingBox.left + assetMetadata.regions[1].boundingBox.width}\t${assetMetadata.regions[1].boundingBox.top}\t${assetMetadata.regions[1].boundingBox.top + assetMetadata.regions[1].boundingBox.height}`);
        expect(writeBoxesCall[1]).toEqual(expectedBoxData.join(os.EOL));
    }
});
