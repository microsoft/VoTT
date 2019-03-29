import MockFactory from "../common/mockFactory";
import packageJson from "../../package.json";
import ImportService from "./importService";
import { AssetState, RegionType, AssetType } from "../models/applicationState";
import HtmlFileReader from "../common/htmlFileReader";
import { IAsset } from "../models/applicationState";
jest.mock("../common/htmlFileReader");

describe("Import Service", () => {
    let importService: ImportService = null;

    beforeEach(() => {
        const actions = MockFactory.projectActions();
        importService = new ImportService(actions);
    });

    it("ConvertProject takes a V1 Image Project and produces a valid V2 project JSON string", async () => {
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
        expect(result.sourceConnection.name).toEqual("TestV1Project Connection");
        expect(result.targetConnection.name).toEqual("TestV1Project Connection");
        expect(result.exportFormat).toBeNull();
        expect(result.videoSettings.frameExtractionRate).toBe(15);
        expect(result.autoSave).toBeTruthy();
    });

    it("ConvertProject takes a V1 Video Project and produces a valid V2 project JSON string", async () => {
        const arrayOfBlob = new Array<Blob>();
        const file = new File(arrayOfBlob, "TestV1VideoProject.mp4", { type: "application/json" });
        file.path = "/Users/user/path/to/TestV1VideoProject.mp4";
        const project = MockFactory.createTestV1VideoProject();
        const content = JSON.stringify(project);
        const result = await importService.convertProject({file, content});

        expect(result.name).toEqual("TestV1VideoProject");
        expect(result.id).not.toBeNull();
        expect(result.version).toEqual(packageJson.version);
        expect(result.securityToken).toEqual("TestV1VideoProject Token");
        expect(result.description).toEqual("Converted V1 Project");
        expect(result.tags).toHaveLength(2);
        expect(result.sourceConnection.name).toEqual("TestV1VideoProject Connection");
        expect(result.targetConnection.name).toEqual("TestV1VideoProject Connection");
        expect(result.exportFormat).toBeNull();
        expect(result.videoSettings.frameExtractionRate).toBe(15);
        expect(result.autoSave).toBeTruthy();
    });

    it("generates assetMetadata given a v1 Image Project FileInfo and an assetService", async () => {
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
        const result = await importService.generateAssets(fileInfo, v2Project);

        expect(result[0].asset.name).toEqual("testFrame0.jpg");
        expect(result[0].asset.state).toEqual(AssetState.Tagged);
        expect(result[0].regions).toHaveLength(3);
        expect(result[1].asset.state).toEqual(AssetState.NotVisited);
        expect(result[0].regions[0].id).toEqual("0");
    });

    it("generates assetMetadata given a v1 Video Project FileInfo and an assetService", async () => {
        const readAssetAttributesMock = HtmlFileReader.readAssetAttributes as jest.Mock;
        HtmlFileReader.readAssetAttributes = readAssetAttributesMock
            .mockImplementationOnce((asset: IAsset) => {
                return Promise.resolve({ width: 820, height: 460, duration: 5.8 });
            });
        const arrayOfBlob = new Array<Blob>();
        const file = new File(arrayOfBlob, "TestV1VideoProject.mp4.json", { type: "application/json" });
        file.path = "/Users/user/path/to/TestV1VideoProject.mp4.json";
        const project = MockFactory.createTestV1VideoProject();
        const content = JSON.stringify(project);
        const fileInfo = {
            content,
            file,
        };

        const v2Project = await importService.convertProject({file, content});
        const result = await importService.generateAssets(fileInfo, v2Project);

        expect(result[0].asset.name).toEqual("TestV1VideoProject.mp4#t=0");
        expect(result[0].asset.state).toEqual(AssetState.Tagged);
        expect(result[0].regions).toHaveLength(3);
        expect(result[2].asset.state).toEqual(AssetState.NotVisited);
        expect(result[0].regions[0].id).toEqual("0");
    });
});
