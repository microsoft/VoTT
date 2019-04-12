import MockFactory from "../common/mockFactory";
import packageJson from "../../package.json";
import ImportService from "./importService";
import { AssetState, RegionType, AssetType } from "../models/applicationState";
import HtmlFileReader from "../common/htmlFileReader";
import { IAsset } from "../models/applicationState";
import registerMixins from "../registerMixins";
jest.mock("../common/htmlFileReader");

describe("Import Service", () => {
    let importService: ImportService = null;

    beforeAll(registerMixins);

    beforeEach(() => {
        importService = new ImportService();
    });

    it("ConvertProject takes a V1 Image Project and produces a valid V2 project JSON string", async () => {
        const arrayOfBlob = new Array<Blob>();
        const file = new File(arrayOfBlob, "TestV1Project.jpg", { type: "application/json" });
        file.path = "/Users/user/path/to/TestV1Project.jpg";
        const project = MockFactory.createTestV1Project();
        const content = JSON.stringify(project);
        const result = await importService.convertProject({ file, content });

        expect(result.name).toEqual("TestV1Project");
        expect(result.id).not.toBeNull();
        expect(result.version).toEqual(packageJson.version);
        expect(result.securityToken).toEqual("TestV1Project Token");
        expect(result.description).toEqual("Converted V1 Project");
        expect(result.tags).toHaveLength(2);
        expect(result.sourceConnection.name).toEqual("TestV1Project Connection");
        expect(result.targetConnection.name).toEqual("TestV1Project Connection");
        expect(result.exportFormat).toBeNull();
        expect(result.videoSettings.frameExtractionRate).toBe(5);
        expect(result.autoSave).toBeTruthy();
    });

    it("ConvertProject takes a V1 Video Project and produces a valid V2 project JSON string", async () => {
        const arrayOfBlob = new Array<Blob>();
        const file = new File(arrayOfBlob, "TestV1VideoProject.mp4", { type: "application/json" });
        file.path = "/Users/user/path/to/TestV1VideoProject.mp4";
        const project = MockFactory.createTestV1VideoProject();
        const content = JSON.stringify(project);
        const result = await importService.convertProject({ file, content });

        expect(result.name).toEqual("TestV1VideoProject");
        expect(result.id).not.toBeNull();
        expect(result.version).toEqual(packageJson.version);
        expect(result.securityToken).toEqual("TestV1VideoProject Token");
        expect(result.description).toEqual("Converted V1 Project");
        expect(result.tags).toHaveLength(2);
        expect(result.sourceConnection.name).toEqual("TestV1VideoProject Connection");
        expect(result.targetConnection.name).toEqual("TestV1VideoProject Connection");
        expect(result.exportFormat).toBeNull();
        expect(result.videoSettings.frameExtractionRate).toBe(1);
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

        const v1FrameLength = Object.keys(project.frames).length;
        const v2Project = await importService.convertProject({ file, content });
        const results = await importService.generateAssets(fileInfo, v2Project);

        expect(results.length).toEqual(v1FrameLength);
        results.forEach((assetMetadata) => {
            const expectedState = assetMetadata.regions.length > 0 ? AssetState.Tagged : AssetState.Visited;
            expect(assetMetadata.asset.state).toEqual(expectedState);
            expect(assetMetadata.asset.parent).toBeUndefined();
            expect(assetMetadata.asset.timestamp).toBeUndefined();
        });
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

        const v1FrameLength = Object.keys(project.frames).length;
        const v2Project = await importService.convertProject({ file, content });
        const results = await importService.generateAssets(fileInfo, v2Project);

        const parentAssets = results.filter((assetMetadata) => !(!!assetMetadata.asset.parent));
        const childAssets = results.filter((assetMetadata) => !!assetMetadata.asset.parent);

        expect(parentAssets).toHaveLength(1);
        expect(childAssets).toHaveLength(v1FrameLength);

        childAssets.forEach((assetMetadata) => {
            const expectedState = assetMetadata.regions.length > 0 ? AssetState.Tagged : AssetState.Visited;
            const expectedPath = `${assetMetadata.asset.parent.path}#t=${assetMetadata.asset.timestamp}`;
            expect(assetMetadata.asset.state).toEqual(expectedState);
            expect(assetMetadata.asset.parent).not.toBeNull();
            expect(assetMetadata.asset.timestamp).not.toBeNull();
            expect(assetMetadata.asset.path).toEqual(expectedPath);
            expect(assetMetadata.asset.name).toContain(`#t=${assetMetadata.asset.timestamp}`);
        });
    });
});
