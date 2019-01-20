import _ from "lodash";
import { ExportProvider, ExportAssetState } from "./exportProvider";
import { IProject, AssetState, AssetType, IAsset,
         IAssetMetadata, RegionType, ITag } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import Guard from "../../common/guard";
import HtmlFileReader from "../../common/htmlFileReader";
import axios from "axios";
import { all } from "deepmerge";
import { itemTemplate, annotationTemplate, objectTemplate } from "./tensorFlowPascalVOC/tensorFlowPascalVOCTemplates";
import { strings, interpolate } from "../../common/strings";
import { TFRecordsImageMessage, Features, Feature,
         BytesList, Int64List } from "./tensorFlowRecords/tensorFlowRecordsProtoBuf_pb";
import CryptoJS from "crypto-js";

/**
 * @name - ITFRecordsJsonExportOptions
 * @description - Defines the configurable options for the Vott JSON Export provider
 */
export interface ITFRecordsJsonExportOptions {
    assetState: ExportAssetState;
}

interface IObjectInfo {
    name: string;
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}

interface IImageInfo {
    width: number;
    height: number;
    objects: IObjectInfo[];
}

/**
 * @name - TFRecords Json Export Provider
 * @description - Exports a project into a single JSON file that include all configured assets
 */
export class TFRecordsJsonExportProvider extends ExportProvider<ITFRecordsJsonExportOptions> {
    private imagesInfo = new Map<string, IImageInfo>();

    constructor(project: IProject, options: ITFRecordsJsonExportOptions) {
        super(project, options);
        Guard.null(options);
    }

    /**
     * Export project to TensorFlow Records
     */
    public async export(): Promise<void> {
        const assetService = new AssetService(this.project);

        let predicate: (asset: IAsset) => boolean = null;

        switch (this.options.assetState) {
            case ExportAssetState.All:
                predicate = (asset) => true;
                break;
            case ExportAssetState.Visited:
                predicate = (asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged;
                break;
            case ExportAssetState.Tagged:
                predicate = (asset) => asset.state === AssetState.Tagged;
                break;
        }

        const loadAssetTasks = _.values(this.project.assets)
            .filter(predicate)
            .map((asset) => assetService.getAssetMetadata(asset));

        const allAssets = await Promise.all(loadAssetTasks);
        const exportObject: any = { ...this.project };
        exportObject.assets = _.keyBy(allAssets, (assetMetadata) => assetMetadata.asset.id);

        // Create Export Folder
        const exportFolderName = `${this.project.name.replace(" ", "-")}-TFRecords-export`;
        await this.storageProvider.createContainer(exportFolderName);

        await this.exportPBTXT(exportFolderName, this.project);
        await this.exportRecords(exportFolderName, allAssets);
    }

    private addStringFeature(features: Features, key: string, value: string): Features {
        const enc = new TextEncoder();
        return this.addBinaryArrayFeature(features, key, enc.encode(value));
    }

    private addBinaryArrayFeature(features: Features, key: string, value: Uint8Array): Features {
        const byteList = new BytesList();
        byteList.addValue(value);

        const feature = new Feature();
        feature.setBytesList(byteList);

        const featuresMap = features.getFeatureMap();
        featuresMap.set(key, feature);

        return features;
    }

    private addIntFeature(features: Features, key: string, value: number): Features {
        const intList = new Int64List();
        intList.addValue(value);

        const feature = new Feature();
        feature.setInt64List(intList);

        const featuresMap = features.getFeatureMap();
        featuresMap.set(key, feature);

        return features;
    }

    private async writeTFRecord(fileNamePath: string, features: Features) {
        const imageMessage = new TFRecordsImageMessage();
        imageMessage.setContext(features);

        const bytes = imageMessage.serializeBinary();
        const buffer = new Buffer(bytes);
        await this.storageProvider.writeBinary(fileNamePath, buffer);
    }

    private async exportRecords(exportFolderName: string, allAssets: IAssetMetadata[]) {
        const allImageExports = allAssets.map((element) => {
            return this.exportSingleRecord(exportFolderName, element);
        });

        try {
            await Promise.all(allImageExports);
        } catch (err) {
            console.log(err);
        }
    }

    private async exportSingleRecord(exportFolderName: string, element: IAssetMetadata): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Get image
            axios.get(element.asset.path, {
                responseType: "arraybuffer",
            })
            .then(async (response) => {
                // Get Base64
                const image64 = btoa(new Uint8Array(response.data).
                    reduce((data, byte) => data + String.fromCharCode(byte), ""));

                // const imageInfo: IImageInfo = {
                //     width: element.asset.size ? element.asset.size.width : 0,
                //     height: element.asset.size ? element.asset.size.height : 0,
                //     objects: tagObjects,
                // };

                // this.imagesInfo.set(element.asset.name, imageInfo);

                // if (!element.asset.size || element.asset.size.width === 0 || element.asset.size.height === 0) {
                //     await this.updateImageSizeInfo(response.data, imageFileName, element.asset.name);
                // }

                // Generate TFRecord
                const features = new Features();
                this.addIntFeature(features, "image/height", 123);
                this.addIntFeature(features, "image/width", 456);
                this.addStringFeature(features, "image/filename", element.asset.name);
                this.addStringFeature(features, "image/source_id", element.asset.name);
                this.addStringFeature(features, "image/key/sha256", CryptoJS.SHA256(image64)
                    .toString(CryptoJS.enc.Base64));
                this.addStringFeature(features, "image/encoded", image64);
                this.addStringFeature(features, "image/format", ".jpg");
                this.addStringFeature(features, "image/object/bbox/xmin", "x");
                this.addStringFeature(features, "image/object/bbox/ymin", "x");
                this.addStringFeature(features, "image/object/bbox/xmax", "x");
                this.addStringFeature(features, "image/object/bbox/ymax", "x");
                this.addStringFeature(features, "image/object/difficult", "0");
                this.addStringFeature(features, "image/object/truncated", "x");
                this.addStringFeature(features, "image/object/view", "x");

                // // Get Array of all Box shaped tag for the Asset
                // const tagObjects = this.getAssetTagArray(element);

                // Save TFRecord
                const fileName = element.asset.name.split(".").slice(0, -1).join(".");
                const fileNamePath = `${exportFolderName}/${fileName}.tfrecord`;
                await this.writeTFRecord(fileNamePath, features);

                resolve();
            })
            .catch((err) => {
                // Ignore the error at the moment
                // TODO: Refactor ExportProvider abstract class export() method
                //       to return Promise<object> with an object containing
                //       the number of files succesfully exported out of total
                console.log(`Error downloading ${element.asset.path} - ${err}`);
                resolve();
                // eject(err);
            });
        });
    }

    private getAssetTagArray(element: IAssetMetadata): IObjectInfo[] {
        const tagObjects = [];
        element.regions.filter((region) => (region.type === RegionType.Rectangle ||
                                                   region.type === RegionType.Square) &&
                                                   region.points.length === 2)
                               .forEach((region) => {
                                    region.tags.forEach((tag) => {
                                        const objectInfo: IObjectInfo = {
                                            name: tag.name,
                                            xmin: region.points[0].x,
                                            ymin: region.points[0].y,
                                            xmax: region.points[1].x,
                                            ymax: region.points[1].y,
                                        };

                                        tagObjects.push(objectInfo);
                                    });
                                });
        return tagObjects;
    }

    private async updateImageSizeInfo(imageBuffer: any, imageFileName: string, assetName: string) {
        // Get Base64
        const image64 = btoa(new Uint8Array(imageBuffer).
            reduce((data, byte) => data + String.fromCharCode(byte), ""));

        if (image64.length < 10) {
            // Ignore the error at the moment
            // TODO: Refactor ExportProvider abstract class export() method
            //       to return Promise<object> with an object containing
            //       the number of files succesfully exported out of total
            console.log(`Image not valid ${imageFileName}`);
        } else {
            const assetProps = await HtmlFileReader.readAssetAttributesWithBuffer(image64);
            const imageInfo = this.imagesInfo.get(assetName);
            if (imageInfo && assetProps) {
                imageInfo.width = assetProps.width;
                imageInfo.height = assetProps.height;
            } else {
                console.log(`imageInfo for element ${assetName} not found (${assetProps})`);
            }
        }
    }

    private async exportPBTXT(exportFolderName: string, project: IProject) {
        if (project.tags && project.tags.length > 0) {
            // Save tf_label_map.pbtxt
            const pbtxtFileName = `${exportFolderName}/tf_label_map.pbtxt`;

            let id = 1;
            const items = project.tags.map((element) => {
                const params = {
                    id: (id++).toString(),
                    tag: element.name,
                };

                return interpolate(itemTemplate, params);
            });

            await this.storageProvider.writeText(pbtxtFileName, items.join(""));
        }
    }
}