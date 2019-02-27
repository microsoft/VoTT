import MockFactory from "../common/mockFactory";
import packageJson from "../../package.json";
import ImportService from "./importService";
import { AssetState, RegionType } from "../models/applicationState";

describe("Import Service", () => {
    let importService: ImportService = null;

    beforeEach(() => {
        const actions = MockFactory.projectActions();
        importService = new ImportService(actions);
    });

    it("ConvertProject takes a V1 Project and produces a valid V2 project JSON string", async () => {
        const arrayOfBlob = new Array<Blob>();
        const file = new File(arrayOfBlob, "TestV1Project.jpg", { type: "application/json" });
        file.path = "/Users/user/path/to/TestV1Project.jpg";
        const project = MockFactory.createTestV1Project();
        const content = JSON.stringify(project);
        const result = await importService.convertProject({file, content});

        expect(result.name).toEqual("TestV1Project");
        expect(result.id).not.toBeNull();
        expect(result.version).toEqual(packageJson.version);
        expect(result.securityToken).toEqual("TestV1Project Token");
        expect(result.description).toEqual("Converted V1 Project");
        expect(result.tags).toHaveLength(2);
        // more tests on connection creation?
        expect(result.sourceConnection.name).toEqual("TestV1Project Connection");
        expect(result.targetConnection.name).toEqual("TestV1Project Connection");
        expect(result.exportFormat).toBeNull();
        expect(result.videoSettings.frameExtractionRate).toBe(15);
        expect(result.autoSave).toBeTruthy();
        // more tests on asset creation?
    });

    it("generates assetMetadata given a v1 Project FileInfo and an assetService", async () => {
        const arrayOfBlob = new Array<Blob>();
        const file = new File(arrayOfBlob, "TestV1Project.jpg", { type: "application/json" });
        file.path = "/Users/user/path/to/TestV1Project.jpg";
        const project = MockFactory.createTestV1Project();
        const content = JSON.stringify(project);
        const fileInfo = {
            content,
            file,
        };
        const v2Project = await importService.convertProject({file, content});

        const testRegion = {
            id: "0",
            boundingBox: {
                left: 1,
                top: 1,
                width: 10,
                height: 10,
            },
            points: [
                { x: 1, y: 1},
                { x: 1, y: 11 },
                { x: 11, y: 1 },
                { x: 11, y: 11 },
            ],
            tags: [],
            type: RegionType.Rectangle,
        };
        const result = await importService.generateAssets(fileInfo, v2Project);

        expect(result[0].asset.name).toEqual("testFrame0.jpg");
        expect(result[0].asset.state).toEqual(AssetState.Tagged);
        expect(result[1].asset.state).toEqual(AssetState.NotVisited);
        expect(result[0].regions[0]).toEqual(testRegion);
    });
});
