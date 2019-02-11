import importService, { IImportService } from "./importService";
import MockFactory from "../common/mockFactory";
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
    });
});
