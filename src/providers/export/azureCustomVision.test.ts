import axios from "axios";
import { AzureCustomVisionProvider, IAzureCustomVisionOptions, NewOrExisting } from "./azureCustomVision";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import MockFactory from "../../common/mockFactory";
import { IProject } from "../../models/applicationState";
import { ExportAssetState } from "./exportProvider";

describe("Azure Custom Vision Export Provider", () => {
    let testProject: IProject = null;

    beforeEach(() => {
        testProject = MockFactory.createTestProject("TestProject");
        testProject.exportFormat = {
            providerType: "azureCustomVision",
            providerOptions: {},
        };

        axios.post = jest.fn(() => Promise.resolve({
            data: {
                id: expect.any(String),
            },
        }));
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
        const customVisionOptions: IAzureCustomVisionOptions = {
            apiKey: expect.any(String),
            assetState: ExportAssetState.All,
            newOrExisting: NewOrExisting.New,
            projectId: expect.any(String),
        };

        testProject.exportFormat.providerOptions = customVisionOptions;
        const provider = new AzureCustomVisionProvider(testProject, testProject.exportFormat.providerOptions);
        const newOptions = await provider.save(testProject.exportFormat);

        expect(axios.post).toBeCalledWith(
            // tslint:disable-next-line:max-line-length
            expect.stringContaining("https://southcentralus.api.cognitive.microsoft.com/customvision/v2.2/Training/projects?"),
            null,
            expect.objectContaining({
                headers: {
                    "Training-key": customVisionOptions.apiKey,
                },
            }));

        expect(newOptions).toEqual(expect.objectContaining({
            assetState: customVisionOptions.assetState,
            apiKey: customVisionOptions.apiKey,
            projectId: expect.any(String),
            newOrExisting: NewOrExisting.Existing,
        }));
    });

    it("Save returns rejected promise during service call failure", async () => {
        const mockPost = axios.post as jest.Mock;
        mockPost.mockImplementationOnce(() => Promise.reject("Bad Request"));

        const customVisionOptions: IAzureCustomVisionOptions = {
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
        const customVisionOptions: IAzureCustomVisionOptions = {
            apiKey: expect.any(String),
            assetState: ExportAssetState.All,
            newOrExisting: NewOrExisting.Existing,
            projectId: expect.any(String),
        };

        testProject.exportFormat.providerOptions = customVisionOptions;
        const provider = new AzureCustomVisionProvider(testProject, testProject.exportFormat.providerOptions);
        const newOptions = await provider.save(testProject.exportFormat);

        expect(newOptions).toEqual(customVisionOptions);
        expect(axios.post).not.toBeCalled();
    });
});
