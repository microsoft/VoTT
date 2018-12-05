import { IAsset, AssetType } from "../models/applicationState";
import MD5 from "md5.js";
import Guard from "../common/guard";

export class AssetService {
    public static createAssetFromFilePath(filePath: string): IAsset {
        Guard.emtpy(filePath);

        const md5Hash = new MD5().update(filePath).digest("hex");
        const pathParts = filePath.indexOf("\\") > -1 ? filePath.split("\\") : filePath.split("/");
        const fileName = pathParts[pathParts.length - 1];
        const fileNameParts = fileName.split(".");
        const assetFormat = fileNameParts[fileNameParts.length - 1];
        const assetType = this.getAssetType(assetFormat);

        return {
            id: md5Hash,
            format: assetFormat,
            type: assetType,
            name: fileName,
            path: filePath,
            size: null,
        };
    }

    public static getAssetType(format: string): AssetType {
        switch (format.toLowerCase()) {
            case "gif":
            case "jpg":
            case "jpeg":
            case "tif":
            case "tiff":
            case "png":
            case "bmp":
                return AssetType.Image;
            case "mp4":
            case "mov":
            case "avi":
            case "m4v":
            case "mpg":
            case "wmv":
                return AssetType.Video;
            default:
                return AssetType.Unknown;
        }
    }
}
