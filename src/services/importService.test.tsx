import importService, { IImportService } from "./importService";
import MockFactory from "../common/mockFactory";
// import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { IProject, IV1Project, /*IExportFormat, ISecurityToken*/ } from "../models/applicationState";
import ImportService from "./importService";
// import { constants } from "../common/constants";
// import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
// import { generateKey } from "../common/crypto";
// import { encryptProject } from "../common/utils";

describe("Import Service", () => {
    let importService: IImportService = null;
    // let projectSerivce: IProjectService = null;
    let testV1Project: IV1Project = null;
    let testProject: IProject = null;
    // let projectList: IProject[] = null;
    // let securityToken: ISecurityToken = null;

    // const storageProviderMock = {
    //     writeText: jest.fn((project) => Promise.resolve(project)),
    //     deleteFile: jest.fn(() => Promise.resolve()),
    // };

    // const exportProviderMock = {
    //     export: jest.fn(() => Promise.resolve()),
    //     save: jest.fn((exportFormat: IExportFormat) => Promise.resolve(exportFormat.providerOptions)),
    // };

    // StorageProviderFactory.create = jest.fn(() => storageProviderMock);
    // ExportProviderFactory.create = jest.fn(() => exportProviderMock);

    beforeEach(() => {
        // securityToken = {
        //     name: "TestToken",
        //     key: generateKey(),
        // };
        testV1Project = MockFactory.createTestV1Project("TestV1Project");
        // testProject = MockFactory.createTestProject("TestProject");
        importService = new ImportService();
    });

    it("ConvertV1 takes a V1 Project and produces a valid V2 project", async () => {
        // const result = await importService.convertV1(testV1Project);

        // expect(result.name).toEqual("")

        // const encryptedProject: IProject = {
        //     ...testProject,
        //     sourceConnection: { ...testProject.sourceConnection },
        //     targetConnection: { ...testProject.targetConnection },
        //     exportFormat: { ...testProject.exportFormat },
        // };
        // encryptedProject.sourceConnection.providerOptions = {
        //     encrypted: expect.any(String),
        // };
        // encryptedProject.targetConnection.providerOptions = {
        //     encrypted: expect.any(String),
        // };
        // encryptedProject.exportFormat.providerOptions = {
        //     encrypted: expect.any(String),
        // };

        // expect(result).toEqual(encryptedProject);
        // expect(StorageProviderFactory.create).toBeCalledWith(
        //     testProject.targetConnection.providerType,
        //     testProject.targetConnection.providerOptions,
        // );

        // expect(storageProviderMock.writeText).toBeCalledWith(
        //     `${testProject.name}${constants.projectFileExtension}`,
        //     expect.any(String));
    });

    // it("generateConnections generates a valid source and target connection", async () => {
    //     // const connections = importService.generateConnections()
    //     // const encryptedProject = encryptProject(testProject, securityToken);
    //     // const decryptedProject = await projectSerivce.load(encryptedProject, securityToken);

    //     // expect(decryptedProject).toEqual(testProject);
    // });

    // it("ParseTags takes a string and produces a list of ITag objects", async () => {
    //     // const encryptedProject = encryptProject(testProject, securityToken);
    //     // const decryptedProject = await projectSerivce.load(encryptedProject, securityToken);

    //     // expect(decryptedProject).toEqual(testProject);
    // });

    // it("generateAssetMetadata generates assets from a V1 project", async () => {
    //     // const encryptedProject = encryptProject(testProject, securityToken);
    //     // const decryptedProject = await projectSerivce.load(encryptedProject, securityToken);

    //     // expect(decryptedProject).toEqual(testProject);
    // });
});
