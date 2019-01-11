import shortid from "shortid";
import _ from "lodash";
import { AzureCustomVisionProvider, IAzureCustomVisionExportOptions, NewOrExisting } from "./azureCustomVision";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import MockFactory from "../../common/mockFactory";
import { IProject, AssetState, IAsset, IAssetMetadata, RegionType, IRegion } from "../../models/applicationState";
import { ExportAssetState } from "./exportProvider";
jest.mock("./azureCustomVision/azureCustomVisionService");
import {
    AzureCustomVisionService, IAzureCustomVisionProject,
    IAzureCustomVisionImage, IAzureCustomVisionTag,
} from "./azureCustomVision/azureCustomVisionService";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";
import HtmlFileReader from "../../common/htmlFileReader";
import { existsSync } from "fs";

describe("Azure Custom Vision Export Provider", () => {
    let testProject: IProject = null;

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

        const customVisionOptions: IAzureCustomVisionExportOptions = {
            apiKey: expect.any(String),
            assetState: ExportAssetState.All,
            newOrExisting: NewOrExisting.New,
            projectId: expect.any(String),
        };

        testProject.exportFormat.providerOptions = customVisionOptions;
        const provider = new AzureCustomVisionProvider(testProject, testProject.exportFormat.providerOptions);
        const newOptions = await provider.save(testProject.exportFormat);

        const customVisionProject: IAzureCustomVisionProject = {
            name: customVisionOptions.name,
            description: customVisionOptions.description,
            classificationType: customVisionOptions.classificationType,
            domainId: customVisionOptions.domainId,
            projectType: customVisionOptions.projectType,
        };

        expect(AzureCustomVisionService.prototype.create).toBeCalledWith(customVisionProject);

        expect(newOptions).toEqual(expect.objectContaining({
            assetState: customVisionOptions.assetState,
            apiKey: customVisionOptions.apiKey,
            projectId: expect.any(String),
            newOrExisting: NewOrExisting.Existing,
        }));
    });

    it("Save returns rejected promise during service call failure", async () => {
        const customVisionMock = AzureCustomVisionService as jest.Mocked<typeof AzureCustomVisionService>;
        customVisionMock.prototype.create = jest.fn((project) => Promise.reject("Error creating project"));

        const customVisionOptions: IAzureCustomVisionExportOptions = {
            apiKey: expect.any(String),
            assetState: ExportAssetState.All,
            newOrExisting: NewOrExisting.New,
            projectId: expect.any(String),
        };

        testProject.exportFormat.providerOptions = customVisionOptions;
        const provider = new AzureCustomVisionProvider(testProject, testProject.exportFormat.providerOptions);
        await expect(provider.save(testProject.exportFormat)).rejects.not.toBeNull();
    });

    it("Calling save with Existing project returns existing provider settings", async () => {
        const customVisionOptions: IAzureCustomVisionExportOptions = {
            apiKey: expect.any(String),
            assetState: ExportAssetState.All,
            newOrExisting: NewOrExisting.Existing,
            projectId: expect.any(String),
        };

        testProject.exportFormat.providerOptions = customVisionOptions;
        const provider = new AzureCustomVisionProvider(testProject, testProject.exportFormat.providerOptions);
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
            testProject.exportFormat.providerOptions.assetState = ExportAssetState.All;
            const taggedAssets = _.values(testProject.assets).filter((asset) => asset.state === AssetState.Tagged);
            const provider = new AzureCustomVisionProvider(testProject, testProject.exportFormat.providerOptions);
            const customVisionMock = AzureCustomVisionService as any;

            const results = await provider.export();

            expect(results).not.toBeNull();
            expect(customVisionMock.prototype.createTag.mock.calls.length).toEqual(testProject.tags.length);
            expect(customVisionMock.prototype.createImage.mock.calls.length).toEqual(testProject.assets.length);
            expect(customVisionMock.prototype.createRegions.mock.calls.length).toEqual(taggedAssets.length);
        });

        it("Uploads binaries, regions & tags for visited assets", () => {
            fail();
        });

        it("Uploads binaries, regions & tags for tagged assets", () => {
            fail();
        });
    });
});
