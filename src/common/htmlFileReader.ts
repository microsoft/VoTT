import axios, { AxiosRequestConfig } from "axios";
import { IAsset, AssetType, IFileInfo } from "../models/applicationState";
import Guard from "./guard";
import { TFRecordsReader } from "../providers/export/tensorFlowRecords/tensorFlowReader";
import { FeatureType } from "../providers/export/tensorFlowRecords/tensorFlowBuilder";

/**
 * Helper class for reading HTML files
 */
export default class HtmlFileReader {

    public static videoAssetFiles = {};

    /**
     * Reads the file and returns the string value contained
     * @param file HTML file to read
     */
    public static readAsText(file: File): Promise<IFileInfo> {
        Guard.null(file);
        let fileInfo: IFileInfo;

        return new Promise<IFileInfo>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                if (reader.result) {
                    fileInfo = {
                        content: reader.result,
                        file,
                    };
                    resolve(fileInfo);
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
            case AssetType.TFRecord:
                return await this.readTFRecordAttributes(asset);
            default:
                throw new Error("Asset not supported");
        }
    }

    public static async readAssetAttributesWithBuffer(base64: string)
        : Promise<{ width: number, height: number, duration?: number }> {
        Guard.null(base64);

        return await this.readImageAttributes("data:image;base64," + base64);
    }

    /**
     * Downloads the binary blob from the asset path
     * @param asset The asset to download
     */
    public static async getAssetBlob(asset: IAsset): Promise<Blob> {
        Guard.null(asset);

        const config: AxiosRequestConfig = {
            responseType: "blob",
        };

        let data = null;
        if (asset.type === AssetType.VideoFrame) {
            data = await this.getAssetFrameImage(asset);
        } else {
            // Download the asset binary from the storage provider
            const response = await axios.get<Blob>(asset.path, config);
            if (response.status !== 200) {
                throw new Error("Error downloading asset binary");
            }
            data = await response.data;
        }

        return data;
    }

    /**
     * Downloads the binary array from the asset path
     * @param asset The asset to download
     */
    public static async getAssetArray(asset: IAsset): Promise<ArrayBuffer> {
        const blob = await this.getAssetBlob(asset);
        return await new Response(blob).arrayBuffer();
    }

    /**
     * Extracts the specified image frame from a video asset
     * @param asset The asset video frame to retrieve from the parent video
     */
    public static async getAssetFrameImage(asset: IAsset): Promise<Blob> {
        return new Promise<Blob>((resolve, reject) => {
            const cachingEnabled = false;
            let refresh = !cachingEnabled;
            let video: HTMLVideoElement = this.videoAssetFiles[asset.parent.name];

            // Ensure the asset name includes jpg file extension
            if (!asset.name.toLowerCase().endsWith(".jpg")) {
                asset.name += ".jpg";
            }

            if (!video) {
                video = document.createElement("video");
                if (cachingEnabled) {
                    this.videoAssetFiles[asset.parent.name] = video;
                    refresh = true;
                }
            }

            video.onloadedmetadata = () => {
                video.currentTime = asset.timestamp;
            };
            video.onseeked = () => {
                const canvas = document.createElement("canvas");
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(resolve, "image/jpeg", 1.0);
            };
            video.onerror = reject;
            if (refresh) {
                video.src = asset.parent.path;
            } else {
                video.currentTime = asset.timestamp;
            }
        });
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

    private static async readTFRecordAttributes(asset: IAsset): Promise<{ width: number, height: number }> {
        // Get from TFRecord Reader
        const tfrecords = new Buffer(await this.getAssetArray(asset));
        const reader = new TFRecordsReader(tfrecords);
        const width = reader.getFeature(0, "image/width", FeatureType.Int64) as number;
        const height = reader.getFeature(0, "image/height", FeatureType.Int64) as number;

        return { width, height };
    }
}
