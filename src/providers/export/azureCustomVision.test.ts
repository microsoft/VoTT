import shortid from "shortid";
import _ from "lodash";
import { AzureCustomVisionProvider, IAzureCustomVisionExportOptions, NewOrExisting } from "./azureCustomVision";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import MockFactory from "../../common/mockFactory";
import {
    IProject, AssetState, IAsset, IAssetMetadata,
    RegionType, IRegion, IExportProviderOptions,
} from "../../models/applicationState";
import { ExportAssetState } from "./exportProvider";
jest.mock("./azureCustomVision/azureCustomVisionService");
import {
    AzureCustomVisionService, IAzureCustomVisionProject,
    IAzureCustomVisionImage, IAzureCustomVisionTag,
} from "./azureCustomVision/azureCustomVisionService";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";
import HtmlFileReader from "../../common/htmlFileReader";

describe("Azure Custom Vision Export Provider", () => {
    let testProject: IProject = null;
    const defaultOptions: IAzureCustomVisionExportOptions = {
        apiKey: expect.any(String),
        assetState: ExportAssetState.All,
        newOrExisting: NewOrExisting.New,
        projectId: expect.any(String),
    };

    function createProvider(project: IProject): AzureCustomVisionProvider {

        return new AzureCustomVisionProvider(
            project,
            project.exportFormat.providerOptions as IAzureCustomVisionExportOptions,
        );
    }

    beforeEach(() => {
        jest.resetAllMocks();
        testProject = {
            ...MockFactory.createTestProject("TestProject"),
            assets: {
                "asset-1": MockFactory.createTestAsset("1", AssetState.Tagged),
                "asset-2": MockFactory.createTestAsset("2", AssetState.Tagged),
                "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
                "asset-4": MockFactory.createTestAsset("4", AssetState.NotVisited),
            },
            exportFormat: {
                providerType: "azureCustomVision",
                providerOptions: {
                    assetState: ExportAssetState.All,
                    projectdId: "azure-custom-vision-project-1",
                    apiKey: "ABC123",
                },
            },
        };
    });

    it("Is Defined", () => {
        expect(AzureCustomVisionProvider).toBeDefined();
    });

    it("Is Registered with the ExportProviderFactory", () => {
        registerProviders();

        const provider = ExportProviderFactory.createFromProject(testProject);
        expect(provider).not.toBeNull();
        expect(provider).toBeInstanceOf(AzureCustomVisionProvider);
    });

    it("Calling save with New project creates Azure Custom Vision project", async () => {
        const customVisionMock = AzureCustomVisionService as jest.Mocked<typeof AzureCustomVisionService>;
        customVisionMock.prototype.create = jest.fn((project) => {
            return Promise.resolve({
                id: shortid.generate(),
                ...project,
            });
        });

        testProject.exportFormat.providerOptions = defaultOptions;
        const provider = createProvider(testProject);
        const newOptions = await provider.save(testProject.exportFormat);

        const customVisionProject: IAzureCustomVisionProject = {
            name: defaultOptions.name,
            description: defaultOptions.description,
            classificationType: defaultOptions.classificationType,
            domainId: defaultOptions.domainId,
            projectType: defaultOptions.projectType,
        };

        expect(AzureCustomVisionService.prototype.create).toBeCalledWith(customVisionProject);

        expect(newOptions).toEqual(expect.objectContaining({
            assetState: defaultOptions.assetState,
            apiKey: defaultOptions.apiKey,
            projectId: expect.any(String),
            newOrExisting: NewOrExisting.Existing,
        }));
    });

    it("Save returns rejected promise during service call failure", async () => {
        const customVisionMock = AzureCustomVisionService as jest.Mocked<typeof AzureCustomVisionService>;
        customVisionMock.prototype.create = jest.fn((project) => Promise.reject("Error creating project"));

        testProject.exportFormat.providerOptions = defaultOptions;
        const provider = createProvider(testProject);

        await expect(provider.save(testProject.exportFormat)).rejects.not.toBeNull();
    });

    it("Calling save with Existing project returns existing provider settings", async () => {
        const customVisionOptions: IAzureCustomVisionExportOptions = {
            ...defaultOptions,
            newOrExisting: NewOrExisting.Existing,
        };

        testProject.exportFormat.providerOptions = customVisionOptions;
        const provider = createProvider(testProject);
        const newOptions = await provider.save(testProject.exportFormat);

        expect(newOptions).toEqual(customVisionOptions);
        expect(AzureCustomVisionService.prototype.create).not.toBeCalled();
    });

    describe("Export Scenarios", () => {
        beforeEach(() => {
            AssetService.prototype.getAssetMetadata = jest.fn((asset: IAsset) => {
                const regions: IRegion[] = [
                    {
                        id: shortid.generate(),
                        type: RegionType.Rectangle,
                        tags: [
                            { name: testProject.tags[0].name },
                        ],
                        boundingBox: {
                            left: 10,
                            top: 10,
                            height: 100,
                            width: 100,
                        },
                    },
                ];

                return Promise.resolve<IAssetMetadata>({
                    asset,
                    regions: asset.state === AssetState.Tagged ? regions : [],
                    timestamp: null,
                });
            });

            HtmlFileReader.getAssetBlob = jest.fn(() => {
                return Promise.resolve(new Blob(["Some binary data"]));
            });

            AzureCustomVisionService.prototype.createImage = jest.fn(() => {
                const imageId = shortid.generate();

                return Promise.resolve<IAzureCustomVisionImage>({
                    id: shortid.generate(),
                    regions: [],
                    tags: [],
                    width: 800,
                    height: 600,
                    imageUri: `https://imageserver/${imageId}`,
                });
            });

            AzureCustomVisionService.prototype.createTag = jest.fn((projectId, tag) => {
                return Promise.resolve<IAzureCustomVisionTag>({
                    ...tag,
                    id: shortid.generate(),
                });
            });

            AzureCustomVisionService.prototype.createRegions = jest.fn(() => Promise.resolve());
            AzureCustomVisionService.prototype.getProjectTags = jest.fn(() => Promise.resolve([]));
        });

        it("Uploads binaries, regions & tags for all assets", async () => {
            (testProject.exportFormat.providerOptions as IExportProviderOptions).assetState = ExportAssetState.All;
            const allAssets = _.values(testProject.assets);
            const taggedAssets = _.values(testProject.assets).filter((asset) => asset.state === AssetState.Tagged);
            const provider = createProvider(testProject);
            const results = await provider.export();

            expect(results).not.toBeNull();
            expect(AzureCustomVisionService.prototype.getProjectTags).toBeCalledTimes(1);
            expect(AzureCustomVisionService.prototype.createTag).toBeCalledTimes(testProject.tags.length);
            expect(AzureCustomVisionService.prototype.createImage).toBeCalledTimes(allAssets.length);
            expect(AzureCustomVisionService.prototype.createRegions).toBeCalledTimes(taggedAssets.length);
        });

        it("Uploads binaries, regions & tags for visited assets", async () => {
            (testProject.exportFormat.providerOptions as IExportProviderOptions).assetState = ExportAssetState.Visited;
            const visitedAssets = _
                .values(testProject.assets)
                .filter((asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged);
            const taggedAssets = _
                .values(testProject.assets)
                .filter((asset) => asset.state === AssetState.Tagged);

            const provider = createProvider(testProject);
            const results = await provider.export();

            expect(results).not.toBeNull();
            expect(AzureCustomVisionService.prototype.getProjectTags).toBeCalledTimes(1);
            expect(AzureCustomVisionService.prototype.createTag).toBeCalledTimes(testProject.tags.length);
            expect(AzureCustomVisionService.prototype.createImage).toBeCalledTimes(visitedAssets.length);
            expect(AzureCustomVisionService.prototype.createRegions).toBeCalledTimes(taggedAssets.length);
        });

        it("Uploads binaries, regions & tags for tagged assets", async () => {
            (testProject.exportFormat.providerOptions as IExportProviderOptions).assetState = ExportAssetState.Tagged;
            const taggedAssets = _.values(testProject.assets).filter((asset) => asset.state === AssetState.Tagged);
            const provider = createProvider(testProject);
            const results = await provider.export();

            expect(results).not.toBeNull();
            expect(AzureCustomVisionService.prototype.getProjectTags).toBeCalledTimes(1);
            expect(AzureCustomVisionService.prototype.createTag).toBeCalledTimes(testProject.tags.length);
            expect(AzureCustomVisionService.prototype.createImage).toBeCalledTimes(taggedAssets.length);
            expect(AzureCustomVisionService.prototype.createRegions).toBeCalledTimes(taggedAssets.length);
        });

        it("Only creates missing tags if only some tags are missing", async () => {
            const existingTags = [
                MockFactory.createAzureCustomVisionTag(testProject.tags[0].name),
                MockFactory.createAzureCustomVisionTag(testProject.tags[1].name),
            ];

            const getProjectsTagsMock = AzureCustomVisionService.prototype.getProjectTags as jest.Mock;
            getProjectsTagsMock.mockImplementationOnce(() => {
                return Promise.resolve(existingTags);
            });

            const provider = createProvider(testProject);
            await provider.export();

            expect(AzureCustomVisionService.prototype.createTag)
                .toBeCalledTimes(testProject.tags.length - existingTags.length);
        });

        it("Returns export results", async () => {
            (testProject.exportFormat.providerOptions as IExportProviderOptions).assetState = ExportAssetState.All;
            const allAssets = _.values(testProject.assets);
            const provider = createProvider(testProject);
            const results = await provider.export();

            expect(results.count).toEqual(allAssets.length);
            expect(results.completed.length).toEqual(allAssets.length);
            expect(results.errors.length).toEqual(0);
        });

        it("Returns partial success results if any error occurs", async () => {
            const getAssetBlobMock = HtmlFileReader.getAssetBlob as jest.Mock;
            HtmlFileReader.getAssetBlob = getAssetBlobMock
                .mockImplementationOnce((asset: IAsset) => {
                    if (asset.path === `C:\\Desktop\\asset1.jpg`) {
                        return Promise.reject("Error downloading binary");
                    } else {
                        Promise.resolve(new Blob(["Some binary data"]));
                    }
                });

            (testProject.exportFormat.providerOptions as IExportProviderOptions).assetState = ExportAssetState.All;

            const allAssets = _.values(testProject.assets);
            const provider = createProvider(testProject);
            const results = await provider.export();

            expect(results.count).toEqual(allAssets.length);
            expect(results.completed.length).toEqual(allAssets.length - 1);
            expect(results.errors.length).toEqual(1);
        });
    });
});
