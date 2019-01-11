import shortid from "shortid";
import { AzureCustomVisionProvider, IAzureCustomVisionExportOptions, NewOrExisting } from "./azureCustomVision";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import MockFactory from "../../common/mockFactory";
import { IProject } from "../../models/applicationState";
import { ExportAssetState } from "./exportProvider";
jest.mock("./azureCustomVision/azureCustomVisionService");
import { AzureCustomVisionService, IAzureCustomVisionProject } from "./azureCustomVision/azureCustomVisionService";

describe("Azure Custom Vision Export Provider", () => {
    let testProject: IProject = null;

    beforeEach(() => {
        jest.resetAllMocks();
        testProject = MockFactory.createTestProject("TestProject");
        testProject.exportFormat = {
            providerType: "azureCustomVision",
            providerOptions: {},
        };
    });

    it("Is Defined", () => {
        expect(AzureCustomVisionProvider).toBeDefined();
    });

    it("Is Registered with the ExportProviderFactory", () => {
        registerProviders();

        const provider = ExportProviderFactory.createFromProject(testProject);
        expect(provider).not.toBeNull();
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
});
