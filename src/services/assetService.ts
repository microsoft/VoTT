import MD5 from "md5.js";
import _ from "lodash";
import * as shortid from "shortid";
import Guard from "../common/guard";
import {
    IAsset, AssetType, IProject, IAssetMetadata, AssetState,
    IRegion, RegionType, ITFRecordMetadata,
} from "../models/applicationState";
import { AssetProviderFactory, IAssetProvider } from "../providers/storage/assetProviderFactory";
import { StorageProviderFactory, IStorageProvider } from "../providers/storage/storageProviderFactory";
import { constants } from "../common/constants";
import HtmlFileReader from "../common/htmlFileReader";
import { TFRecordsReader } from "../providers/export/tensorFlowRecords/tensorFlowReader";
import { FeatureType } from "../providers/export/tensorFlowRecords/tensorFlowBuilder";
import { appInfo } from "../common/appInfo";
import { encodeFileURI } from "../common/utils";
import { basename, extname, relative, dirname, normalize, join, isAbsolute } from "path";
import ProjectService from "./projectService";
import { VottRegex } from "../common/regex";

/**
 * @name - Asset Service
 * @description - Functions for dealing with project assets
 */
export class AssetService {

    /**
     * Get Asset Provider from project's source connction
     */
    protected get assetProvider(): IAssetProvider {
        if (!this.assetProviderInstance) {
            this.assetProviderInstance = AssetProviderFactory.create(
                this.project.sourceConnection.providerType,
                this.project.sourceConnection.providerOptions,
            );

            return this.assetProviderInstance;
        }
    }

    /**
     * Get Storage Provider from project's target connection
     */
    protected get storageProvider(): IStorageProvider {
        if (!this.storageProviderInstance) {
            this.storageProviderInstance = StorageProviderFactory.create(
                this.project.targetConnection.providerType,
                this.project.targetConnection.providerOptions,
            );
        }

        return this.storageProviderInstance;
    }

    /**
     * Create IAsset from filePath
     * @param assetFilePath - filepath of asset
     * @param assetFileName - name of asset
     */
    public static createAssetFromFilePath(
            assetFilePath: string,
            projectSourceFolderPath: string,
            assetFileName?: string): IAsset {
        Guard.empty(assetFilePath);
        assetFilePath = decodeURIComponent(assetFilePath);

        const format = this.getAssetFormat(assetFilePath);
        const assetPath = this.getAssetPath(assetFilePath, projectSourceFolderPath);

        return {
            id: this.getAssetHash(assetPath),
            format,
            state: AssetState.NotVisited,
            type: this.getAssetType(format),
            name: assetFileName || this.getAssetName(assetFilePath),
            path: assetPath,
            size: null,
        };
    }

    public static getAssetFormat(filePath: string): string {
        const fileName = basename(filePath);
        const extension = extname(fileName).replace(".", "");
        const extensionParts = extension.split(/[\?#]/);
        return extensionParts[0].toLowerCase();
    }

    public static getAssetAbsolutePath(assetPath: string, project: IProject) {
        if (assetPath.match(VottRegex.HttpPrefix)) {
            return assetPath;
        }
        assetPath = assetPath.replace(/^file:/, "");
        if (isAbsolute(assetPath)) {
            return `file:${assetPath}`;
        }
        const projectFolderPath = ProjectService.getProjectSourceFolderPath(project);
        return join(projectFolderPath, assetPath.replace(/^file:/, ""));
    }

    /**
     * Get Asset Type from format (file extension)
     * @param format - File extension of asset
     */
    public static getAssetType(assetFormat: string): AssetType {
        switch (assetFormat.toLowerCase()) {
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
            case "tfrecord":
                return AssetType.TFRecord;
            default:
                return AssetType.Unknown;
        }
    }

    private static normalizePath(filePath: string): string {
        return filePath
            .toLowerCase()
            .replace(/^file:/, "");
    }

    private static getAssetName(assetFilePath: string): string {
        return decodeURIComponent(basename(assetFilePath));
    }

    private static getAssetHash(assetPath: string): string {
        return new MD5().update(assetPath).digest("hex");
    }

    private static getAssetPath(assetFilePath: string, projectFolderPath: string): string {
        if (assetFilePath.match(/^https?:\/\//)) {
            return encodeURI(assetFilePath);
        }
        assetFilePath = this.normalizePath(assetFilePath);
        projectFolderPath = this.normalizePath(projectFolderPath);
        const relativePath = relative(projectFolderPath, assetFilePath);
        return encodeFileURI(relativePath);
    }

    private assetProviderInstance: IAssetProvider;
    private storageProviderInstance: IStorageProvider;

    constructor(private project: IProject) {
        Guard.null(project);
    }

    /**
     * Get assets from provider
     */
    public async getAssets(): Promise<IAsset[]> {
        return await this.assetProvider.getAssets();
    }

    /**
     * Get a list of child assets associated with the current asset
     * @param rootAsset The parent asset to search
     */
    public getChildAssets(rootAsset: IAsset): IAsset[] {
        Guard.null(rootAsset);

        if (rootAsset.type !== AssetType.Video) {
            return [];
        }

        return _
            .values(this.project.assets)
            .filter((asset) => asset.parent && asset.parent.id === rootAsset.id)
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Save metadata for asset
     * @param metadata - Metadata for asset
     */
    public async save(metadata: IAssetMetadata): Promise<IAssetMetadata> {
        Guard.null(metadata);

        const fileName = `${metadata.asset.id}${constants.assetMetadataFileExtension}`;

        // Only save asset metadata if asset is in a tagged state
        // Otherwise primary asset information is already persisted in the project file.
        if (metadata.asset.state === AssetState.Tagged) {
            await this.storageProvider.writeText(fileName, JSON.stringify(metadata, null, 4));
        } else {
            // If the asset is no longer tagged, then it doesn't contain any regions
            // and the file is not required.
            try {
                await this.storageProvider.deleteFile(fileName);
            } catch (err) {
                // The file may not exist - that's OK
            }
        }
        return metadata;
    }

    /**
     * Get metadata for asset
     * @param asset - Asset for which to retrieve metadata
     */
    public async getAssetMetadata(asset: IAsset): Promise<IAssetMetadata> {
        Guard.null(asset);

        const fileName = `${asset.id}${constants.assetMetadataFileExtension}`;
        try {
            const json = await this.storageProvider.readText(fileName);
            return JSON.parse(json) as IAssetMetadata;
        } catch (err) {
            if (asset.type === AssetType.TFRecord) {
                return {
                    asset: { ...asset },
                    regions: await this.getRegionsFromTFRecord(asset),
                    version: appInfo.version,
                };
            } else {
                return {
                    asset: { ...asset },
                    regions: [],
                    version: appInfo.version,
                };
            }
        }
    }

    /**
     * Delete a tag from asset metadata files
     * @param tagName Name of tag to delete
     */
    public async deleteTag(tagName: string): Promise<IAssetMetadata[]> {
        const transformer = (tags) => tags.filter((t) => t !== tagName);
        return await this.getUpdatedAssets(tagName, transformer);
    }

    /**
     * Rename a tag within asset metadata files
     * @param tagName Name of tag to rename
     */
    public async renameTag(tagName: string, newTagName: string): Promise<IAssetMetadata[]> {
        const transformer = (tags) => tags.map((t) => (t === tagName) ? newTagName : t);
        return await this.getUpdatedAssets(tagName, transformer);
    }

    /**
     * Update tags within asset metadata files
     * @param tagName Name of tag to update within project
     * @param transformer Function that accepts array of tags from a region and returns a modified array of tags
     */
    private async getUpdatedAssets(tagName: string, transformer: (tags: string[]) => string[])
        : Promise<IAssetMetadata[]> {
        // Loop over assets and update if necessary
        const updates = await _.values(this.project.assets).mapAsync(async (asset) => {
            const assetMetadata = await this.getAssetMetadata(asset);
            const isUpdated = this.updateTagInAssetMetadata(assetMetadata, tagName, transformer);

            return isUpdated ? assetMetadata : null;
        });

        return updates.filter((assetMetadata) => !!assetMetadata);
    }

    /**
     * Update tag within asset metadata object
     * @param assetMetadata Asset metadata to update
     * @param tagName Name of tag being updated
     * @param transformer Function that accepts array of tags from a region and returns a modified array of tags
     * @returns Modified asset metadata object or null if object does not need to be modified
     */
    private updateTagInAssetMetadata(
        assetMetadata: IAssetMetadata,
        tagName: string,
        transformer: (tags: string[]) => string[]): boolean {
        let foundTag = false;

        for (const region of assetMetadata.regions) {
            if (region.tags.find((t) => t === tagName)) {
                foundTag = true;
                region.tags = transformer(region.tags);
            }
        }
        if (foundTag) {
            assetMetadata.regions = assetMetadata.regions.filter((region) => region.tags.length > 0);
            assetMetadata.asset.state = (assetMetadata.regions.length) ? AssetState.Tagged : AssetState.Visited;
            return true;
        }

        return false;
    }

    private async getRegionsFromTFRecord(asset: IAsset): Promise<IRegion[]> {
        const objectArray = await this.getTFRecordMetadata(asset);
        const regions: IRegion[] = [];

        // Add Regions from TFRecord in Regions
        for (let index = 0; index < objectArray.textArray.length; index++) {
            regions.push({
                id: shortid.generate(),
                type: RegionType.Rectangle,
                tags: [objectArray.textArray[index]],
                boundingBox: {
                    left: objectArray.xminArray[index] * objectArray.width,
                    top: objectArray.yminArray[index] * objectArray.height,
                    width: (objectArray.xmaxArray[index] - objectArray.xminArray[index]) * objectArray.width,
                    height: (objectArray.ymaxArray[index] - objectArray.yminArray[index]) * objectArray.height,
                },
                points: [{
                    x: objectArray.xminArray[index] * objectArray.width,
                    y: objectArray.yminArray[index] * objectArray.height,
                },
                {
                    x: objectArray.xmaxArray[index] * objectArray.width,
                    y: objectArray.ymaxArray[index] * objectArray.height,
                }],
            });
        }

        return regions;
    }

    private async getTFRecordMetadata(asset: IAsset): Promise<ITFRecordMetadata> {
        const tfrecords = new Buffer(await HtmlFileReader.getAssetArray(asset, this.project));
        const reader = new TFRecordsReader(tfrecords);

        const width = reader.getFeature(0, "image/width", FeatureType.Int64) as number;
        const height = reader.getFeature(0, "image/height", FeatureType.Int64) as number;

        const xminArray = reader.getArrayFeature(0, "image/object/bbox/xmin", FeatureType.Float) as number[];
        const yminArray = reader.getArrayFeature(0, "image/object/bbox/ymin", FeatureType.Float) as number[];
        const xmaxArray = reader.getArrayFeature(0, "image/object/bbox/xmax", FeatureType.Float) as number[];
        const ymaxArray = reader.getArrayFeature(0, "image/object/bbox/ymax", FeatureType.Float) as number[];
        const textArray = reader.getArrayFeature(0, "image/object/class/text", FeatureType.String) as string[];

        return { width, height, xminArray, yminArray, xmaxArray, ymaxArray, textArray };
    }
}
