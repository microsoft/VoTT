import shortid from "shortid";
import axios, { AxiosResponse } from "axios";
import {
    AzureCustomVisionService, IAzureCustomVisionServiceOptions, IAzureCustomVisionProject, IAzureCustomVisionImage,
} from "./azureCustomVisionService";
import MockFactory from "../../../common/mockFactory";

describe("Azure Custom Vision Service", () => {
    let customVisionService: AzureCustomVisionService;
    let customVisionOptions: IAzureCustomVisionServiceOptions = null;
    let getMock: jest.Mock = null;
    let postMock: jest.Mock = null;

    beforeEach(() => {
        customVisionOptions = {
            baseUrl: "https://southcentralus.api.cognitive.microsoft.com/customvision/v2.2/Training",
            apiKey: "ABC123",
        };
        customVisionService = new AzureCustomVisionService(customVisionOptions);
    });

    beforeAll(() => {
        axios.get = jest.fn();
        axios.post = jest.fn();
        getMock = axios.get as jest.Mock;
        postMock = axios.post as jest.Mock;
    });

    describe("Creating new projects", () => {
        const testProject: IAzureCustomVisionProject = {
            name: "Test Project",
            description: "Test Project Description",
            projectType: "ObjectDetection",
            classificationType: "MultiClass",
            domainId: "XZY123",
        };

        it("Creates a new project", async () => {
            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 200,
                    statusText: "OK",
                    data: {
                        id: shortid.generate(),
                        ...testProject,
                    },
                });
            });

            const result = await customVisionService.create(testProject);
            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects?`),
                null,
                expect.anything(),
            );
            expect(result).toEqual(expect.objectContaining(testProject));
            expect(result.id).not.toBeNull();
        });

        it("Throws an error if service call fails", async () => {
            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 400,
                    statusText: "Bad Request",
                    data: {},
                });
            });

            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects?`),
                null,
                expect.anything(),
            );

            await expect(customVisionService.create(testProject)).rejects.not.toBeNull();
        });
    });

    describe("Get project tags", () => {
        const projectId = "Get-Project-Tags";

        it("Resolves project tags with valid project id", async () => {
            const expectedTags = MockFactory.createAzureCustomVisionTags();

            getMock.mockImplementationOnce((url, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 200,
                    statusText: "OK",
                    data: expectedTags,
                });
            });

            const result = await customVisionService.getProjectTags(projectId);

            expect(axios.get).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/tags`),
                expect.anything(),
            );
            expect(result).toEqual(expectedTags);
        });

        it("Rejects when projectId is invalid and returns 404", async () => {
            getMock.mockImplementationOnce((url, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 404,
                    statusText: "Not Found",
                    data: {},
                });
            });

            await expect(customVisionService.getProjectTags(projectId)).rejects.not.toBeNull();

            expect(axios.get).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/tags`),
                expect.anything(),
            );
        });
    });

    describe("Create tags", () => {
        const projectId = "Project-1";
        const customVisionTag = MockFactory.createAzureCustomVisionTag("Test Tag");
        delete customVisionTag.id;

        it("Creates a new tag with valid project id", async () => {
            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 200,
                    statusText: "OK",
                    data: {
                        id: shortid.generate(),
                        ...customVisionTag,
                    },
                });
            });

            const result = await customVisionService.createTag(projectId, customVisionTag);

            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/tags`),
                null,
                expect.anything(),
            );
            expect(result).toEqual(expect.objectContaining(customVisionTag));
            expect(result.id).not.toBeNull();
        });

        it("Rejects with invalid project id", async () => {
            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 404,
                    statusText: "Not Found",
                    data: {},
                });
            });

            await expect(customVisionService.createTag(projectId, customVisionTag)).rejects.not.toBeNull();

            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/tags`),
                null,
                expect.anything(),
            );
        });
    });

    describe("Create Images", () => {
        const projectId = "Create-Images-Project-Id";
        const blob = new Blob(["Some binary data"]);

        it("Creates new images with valid project id", async () => {
            const imageId = shortid.generate();
            const expectedImage: IAzureCustomVisionImage = {
                id: imageId,
                width: 800,
                height: 600,
                imageUri: `https://myserver.com/${imageId}`,
                tags: [],
                regions: [],
            };

            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 200,
                    statusText: "OK",
                    data: {
                        images: [{ image: expectedImage }],
                    },
                });
            });

            const result = await customVisionService.createImage(projectId, blob);
            expect(result).toEqual(expectedImage);
            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/images`),
                blob,
                expect.anything(),
            );
        });

        it("Rejects with invalid projectd id", async () => {
            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 404,
                    statusText: "Not Found",
                    data: {},
                });
            });

            await expect(customVisionService.createImage(projectId, blob)).rejects.not.toBeNull();
            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/images`),
                blob,
                expect.anything(),
            );
        });
    });

    describe("Create regions", () => {
        const projectId = "Create-Regions-ProjectId";
        const regions = MockFactory.createAzureCustomVisionRegions();

        it("Creates new regions with valid project, image and tag ids", async () => {
            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 200,
                    statusText: "OK",
                    data: {},
                });
            });

            await expect(customVisionService.createRegions(projectId, regions)).resolves.not.toBeNull();
            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/images/regions`),
                { regions },
                expect.anything(),
            );
        });

        it("Rejects when project id is invalid", async () => {
            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 404,
                    statusText: "Not Found",
                    data: {},
                });
            });

            await expect(customVisionService.createRegions(projectId, regions)).rejects.not.toBeNull();
            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/images/regions`),
                { regions },
                expect.anything(),
            );
        });

        it("Rejects with invalid region data", async () => {
            postMock.mockImplementationOnce((url, data, config) => {
                return Promise.resolve<AxiosResponse>({
                    headers: {},
                    config,
                    status: 400,
                    statusText: "Not Found",
                    data: {
                        code: "BadRequestImageRegions",
                        message: "Illegal region",
                    },
                });
            });

            await expect(customVisionService.createRegions(projectId, regions)).rejects.not.toBeNull();
            expect(axios.post).toBeCalledWith(
                expect.stringContaining(`${customVisionOptions.baseUrl}/projects/${projectId}/images/regions`),
                { regions },
                expect.anything(),
            );
        });
    });
});
