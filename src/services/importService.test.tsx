import MockFactory from "../common/mockFactory";
import { IV1Project } from "../models/v1Models";
import ImportService from "./importService";

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
