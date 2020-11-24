import _ from "lodash";
import ProjectService, { IProjectService } from "./projectService";
import MockFactory from "../common/mockFactory";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import {
    IProject, IExportFormat, ISecurityToken,
    AssetState, IActiveLearningSettings, ModelPathType, EditorContext,
} from "../models/applicationState";
import { constants } from "../common/constants";
import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
import { generateKey } from "../common/crypto";
import { encryptProject, decryptProject } from "../common/utils";
import { ExportAssetState } from "../providers/export/exportProvider";
import { IVottJsonExportProviderOptions } from "../providers/export/vottJson";
import { IPascalVOCExportProviderOptions } from "../providers/export/pascalVOC";

describe("Project Service", () => {
    let projectSerivce: IProjectService = null;
    let testProject: IProject = null;
    let projectList: IProject[] = null;
    let securityToken: ISecurityToken = null;

    const storageProviderMock = {
        writeText: jest.fn((project) => Promise.resolve(project)),
        deleteFile: jest.fn(() => Promise.resolve()),
    };

    const exportProviderMock = {
        export: jest.fn(() => Promise.resolve()),
        save: jest.fn((exportFormat: IExportFormat) => Promise.resolve(exportFormat.providerOptions)),
    };

    StorageProviderFactory.create = jest.fn(() => storageProviderMock);
    ExportProviderFactory.create = jest.fn(() => exportProviderMock);

    beforeEach(() => {
        securityToken = {
            name: "TestToken",
            key: generateKey(),
        };
        testProject = MockFactory.createTestProject("TestProject");
        projectSerivce = new ProjectService();

        storageProviderMock.writeText.mockClear();
        storageProviderMock.deleteFile.mockClear();
    });

    it("Load decrypts any project settings using the specified key", async () => {
        const encryptedProject = encryptProject(testProject, securityToken);
        const decryptedProject = await projectSerivce.load(encryptedProject, securityToken);

        expect(decryptedProject).toEqual(testProject);
    });

    it("Saves calls project storage provider to write project", async () => {
        const result = await projectSerivce.save(testProject, securityToken);

        const encryptedProject: IProject = {
            ...testProject,
            sourceConnection: { ...testProject.sourceConnection },
            metadataConnection: { ...testProject.metadataConnection },
            targetConnection: { ...testProject.targetConnection },
            exportFormat: { ...testProject.exportFormat },
        };
        encryptedProject.sourceConnection.providerOptions = {
            encrypted: expect.any(String),
        };
        encryptedProject.metadataConnection.providerOptions = {
            encrypted: expect.any(String),
        };
        encryptedProject.targetConnection.providerOptions = {
            encrypted: expect.any(String),
        };
        encryptedProject.exportFormat.providerOptions = {
            encrypted: expect.any(String),
        };

        expect(result).toEqual(encryptedProject);
        expect(StorageProviderFactory.create).toBeCalledWith(
            testProject.targetConnection.providerType,
            testProject.targetConnection.providerOptions,
        );

        expect(storageProviderMock.writeText).toBeCalledWith(
            `${testProject.name}${constants.projectFileExtension}`,
            expect.any(String));
    });

    it("sets default export settings when not defined", async () => {
        testProject.exportFormat = null;
        const result = await projectSerivce.save(testProject, securityToken);

        const vottJsonExportProviderOptions: IVottJsonExportProviderOptions = {
            assetState: ExportAssetState.Visited,
            includeImages: true,
        };

        const expectedExportFormat: IExportFormat = {
            providerType: "vottJson",
            providerOptions: vottJsonExportProviderOptions,
        };

        const decryptedProject = decryptProject(result, securityToken);

        expect(decryptedProject.exportFormat).toEqual(expectedExportFormat);
    });

    it("sets default active learning setting when not defined", async () => {
        testProject.activeLearningSettings = null;
        const result = await projectSerivce.save(testProject, securityToken);

        const activeLearningSettings: IActiveLearningSettings = {
            autoDetect: false,
            predictTag: true,
            modelPathType: ModelPathType.Coco,
        };

        expect(result.activeLearningSettings).toEqual(activeLearningSettings);
    });

    it("initializes tags to empty array if not defined", async () => {
        testProject.tags = null;
        const result = await projectSerivce.save(testProject, securityToken);

        expect(result.tags).toEqual([]);
    });

    it("Save calls configured export provider save when defined", async () => {
        testProject.exportFormat = {
            providerType: "azureCustomVision",
            providerOptions: null,
        };

        await projectSerivce.save(testProject, securityToken);

        expect(ExportProviderFactory.create).toBeCalledWith(
            testProject.exportFormat.providerType,
            testProject,
            testProject.exportFormat.providerOptions,
        );
        expect(exportProviderMock.save).toBeCalledWith(testProject.exportFormat);
    });

    it("Save throws error if writing to storage provider fails", async () => {
        const expectedError = "Error writing to storage provider";
        storageProviderMock.writeText.mockImplementationOnce(() => Promise.reject(expectedError));
        await expect(projectSerivce.save(testProject, securityToken)).rejects.toEqual(expectedError);
    });

    it("Save throws error if storage provider cannot be created", async () => {
        const expectedError = new Error("Error creating storage provider");
        const createMock = StorageProviderFactory.create as jest.Mock;
        createMock.mockImplementationOnce(() => { throw expectedError; });

        await expect(projectSerivce.save(testProject, securityToken)).rejects.toEqual(expectedError);
    });

    it("Delete calls project storage provider to delete project", async () => {
        await projectSerivce.delete(testProject);

        expect(StorageProviderFactory.create).toBeCalledWith(
            testProject.targetConnection.providerType,
            testProject.targetConnection.providerOptions,
        );

        expect(storageProviderMock.deleteFile).toBeCalledWith(`${testProject.name}${constants.projectFileExtension}`);
    });

    it("Delete call fails if deleting from storageProvider fails", async () => {
        const expectedError = "Error deleting from storage provider";
        storageProviderMock.deleteFile
            .mockImplementationOnce(() => Promise.reject(expectedError));

        await expect(projectSerivce.delete(testProject)).rejects.toEqual(expectedError);
    });

    it("Delete call fails if storage provider cannot be created", async () => {
        const expectedError = new Error("Error creating storage provider");
        const createMock = StorageProviderFactory.create as jest.Mock;
        createMock.mockImplementationOnce(() => { throw expectedError; });

        await expect(projectSerivce.delete(testProject)).rejects.toEqual(expectedError);
    });

    it("isDuplicate returns false when called with a unique project", async () => {
        testProject = MockFactory.createTestProject("TestProject");
        projectList = MockFactory.createTestProjects();
        expect(projectSerivce.isDuplicate(testProject, projectList)).toEqual(false);
    });

    it("isDuplicate returns true when called with a duplicate project", async () => {
        testProject = MockFactory.createTestProject("1");
        testProject.id = undefined;
        projectList = MockFactory.createTestProjects();
        expect(projectSerivce.isDuplicate(testProject, projectList)).toEqual(true);
    });

    ////////////////////////////////////////////////////////////////
    // WARNING: should be updated
    it("deletes all asset metadata files when project is deleted", async () => {
        const assets = MockFactory.createTestAssets(10);
        assets.forEach((asset) => {
            asset.state = { [EditorContext.Geometry]: AssetState.Tagged, } ;
        });

        testProject.assets = _.keyBy(assets, (asset) => asset.id);

        await projectSerivce.delete(testProject);
        expect(storageProviderMock.deleteFile.mock.calls).toHaveLength(assets.length + 1);
    });

    it("Updates export settings to v2.1 supported values", async () => {
        testProject = MockFactory.createTestProject("TestProject");
        testProject.version = "2.0.0";
        testProject.exportFormat = {
            providerType: "tensorFlowPascalVOC",
            providerOptions: {
                assetState: ExportAssetState.All,
                exportUnassigned: true,
                testTrainSplit: 80,
            } as IPascalVOCExportProviderOptions,
        };

        const encryptedProject = encryptProject(testProject, securityToken);
        const decryptedProject = await projectSerivce.load(encryptedProject, securityToken);

        expect(decryptedProject.exportFormat.providerType).toEqual("pascalVOC");
        expect(decryptedProject.exportFormat.providerOptions).toEqual(testProject.exportFormat.providerOptions);
    });
});
