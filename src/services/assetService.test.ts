import { AssetService } from "./assetService";
import { AssetType } from "../models/applicationState";

describe("Asset Service", () => {
    it("creates an asset from a file path", () => {
        const path = "C:\\dir1\\dir2\\asset1.jpg";
        const asset = AssetService.createAssetFromFilePath(path);

        expect(asset).not.toBeNull();
        expect(asset.id).toEqual(expect.any(String));
        expect(asset.name).toEqual("asset1.jpg");
        expect(asset.type).toEqual(AssetType.Image);
        expect(asset.path).toEqual(path);
        expect(asset.format).toEqual("jpg");
    });

    it("creates an asset from a http source", () => {
        const path = "http://my.server.com/asset1.jpg";
        const asset = AssetService.createAssetFromFilePath(path);

        expect(asset).not.toBeNull();
        expect(asset.id).toEqual(expect.any(String));
        expect(asset.name).toEqual("asset1.jpg");
        expect(asset.type).toEqual(AssetType.Image);
        expect(asset.path).toEqual(path);
        expect(asset.format).toEqual("jpg");
    });

    it("detects an image asset by common file extension", () => {
        const path = "C:\\dir1\\dir2\\asset1.png";
        const asset = AssetService.createAssetFromFilePath(path);
        expect(asset.type).toEqual(AssetType.Image);
    });

    it("detects a video asset by common file extension", () => {
        const path = "C:\\dir1\\dir2\\asset1.mp4";
        const asset = AssetService.createAssetFromFilePath(path);
        expect(asset.type).toEqual(AssetType.Video);
    });

    it("detects an asset as unkonwn if it doesn't match well known file extensions", () => {
        const path = "C:\\dir1\\dir2\\asset1.docx";
        const asset = AssetService.createAssetFromFilePath(path);
        expect(asset.type).toEqual(AssetType.Unknown);
    });
});
