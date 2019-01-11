import { IAsset, AssetType } from "../models/applicationState";
import Guard from "./guard";

/**
 * Helper class for reading HTML files
 */
export default class HtmlFileReader {

    /**
     * Reads the file and returns the string value contained
     * @param file HTML file to read
     */
    public static readAsText(file: File): Promise<string | ArrayBuffer> {
        Guard.null(file);

        return new Promise<string | ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                if (reader.result) {
                    resolve(reader.result);
                } else {
                    reject();
                }
            };

            try {
                reader.readAsText(file);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Reads attributes from asset depending on type (video or image)
     * @param asset Asset to read from
     */
    public static async readAssetAttributes(asset: IAsset)
        : Promise<{ width: number, height: number, duration?: number }> {
        Guard.null(asset);

        switch (asset.type) {
            case AssetType.Image:
                return await this.readImageAttributes(asset.path);
            case AssetType.Video:
                return await this.readVideoAttributes(asset.path);
            default:
                throw new Error("Asset not supported");
        }
    }
    
    private static readVideoAttributes(url: string): Promise<{ width: number, height: number, duration: number }> {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video") as HTMLVideoElement;
            video.onloadedmetadata = () => {
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration,
                });
            };
            video.onerror = reject;
            video.src = url;
        });
    }

    private static readImageAttributes(url: string): Promise<{ width: number, height: number }> {
        return new Promise((resolve, reject) => {
            const image = document.createElement("img") as HTMLImageElement;
            image.onload = () => {
                resolve({
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                });
            };
            image.onerror = reject;
            image.src = url;
        });
    }
}
