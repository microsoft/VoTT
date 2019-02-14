import axios, { AxiosRequestConfig } from "axios";
import { IAsset, AssetType } from "../models/applicationState";
import Guard from "./guard";
import { TFRecordsReader } from "../providers/export/tensorFlowRecords/tensorFlowReader";
import { FeatureType } from "../providers/export/tensorFlowRecords/tensorFlowBuilder";

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

        let response = null;
        if (asset.type === AssetType.VideoFrame) {
            response = this.getAssetFrameImage(asset, (img, secs, event) => {
                console.log(img);
                console.log(secs);
                console.log(event);
                return (img);
            });
        }
        // Download the asset binary from the storage provider
        response = await axios.get<Blob>(asset.path, config);
        if (response.status !== 200) {
            throw new Error("Error downloading asset binary");
        }

        return response.data;
    }

    public static getAssetFrameImage(asset: IAsset, callback) {
        const video = document.createElement("video");
        const secs = asset.timestamp;
        video.onloadedmetadata = function() {
            this.currentTime = Math.min(Math.max(0, (secs < 0 ? this.duration : 0) + secs), this.duration);
        }.bind(video);
        video.onseeked = function(e) {
            const canvas = document.createElement("canvas");
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const img = new Image();
            img.src = canvas.toDataURL();
            callback.call(this, img, this.currentTime, e);
        }.bind(video);
        video.onerror = (e) => {
            callback.call(this, undefined, undefined, e);
        };
        video.src = asset.path;
    }

    /**
     * Downloads the binary array from the asset path
     * @param asset The asset to download
     */
    public static async getAssetArray(asset: IAsset): Promise<Uint8Array> {
        const blob = await this.getAssetBlob(asset);
        const byteArray = await new Response(blob).arrayBuffer();
        return new Uint8Array(byteArray);
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
