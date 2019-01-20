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

interface IImageInfo {
    width: number;
    height: number;
    name: string[];
    xmin: number[];
    ymin: number[];
    xmax: number[];
    ymax: number[];
}

/**
 * @name - TFRecords Json Export Provider
 * @description - Exports a project into a single JSON file that include all configured assets
 */
export class TFRecordsJsonExportProvider extends ExportProvider<ITFRecordsJsonExportOptions> {
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

                const imageInfo: IImageInfo = {
                    width: element.asset.size ? element.asset.size.width : 0,
                    height: element.asset.size ? element.asset.size.height : 0,
                    name: [],
                    xmin: [],
                    ymin: [],
                    xmax: [],
                    ymax: [],
                };

                if (!element.asset.size || element.asset.size.width === 0 || element.asset.size.height === 0) {
                    await this.updateImageSizeInfo(image64, imageInfo);
                }

                // Get Array of all Box shaped tag for the Asset
                this.updateAssetTagArrays(element, imageInfo);

                // Generate TFRecord
                const features = new Features();
                this.addIntFeature(features, "image/height", imageInfo.height);
                this.addIntFeature(features, "image/width", imageInfo.width);
                this.addStringFeature(features, "image/filename", element.asset.name);
                this.addStringFeature(features, "image/source_id", element.asset.name);
                this.addStringFeature(features, "image/key/sha256", CryptoJS.SHA256(image64)
                    .toString(CryptoJS.enc.Base64));
                this.addStringFeature(features, "image/encoded", image64);
                this.addStringFeature(features, "image/format", element.asset.name.split(".").pop());
                this.addStringFeature(features, "image/object/bbox/xmin", "x");
                this.addStringFeature(features, "image/object/bbox/ymin", "x");
                this.addStringFeature(features, "image/object/bbox/xmax", "x");
                this.addStringFeature(features, "image/object/bbox/ymax", "x");
                this.addStringFeature(features, "image/object/class/text", "x");
                this.addStringFeature(features, "image/object/class/label", "x");
                this.addIntFeature(features, "image/object/difficult", 0);
                this.addIntFeature(features, "image/object/truncated", 0);
                this.addStringFeature(features, "image/object/view", "Unspecified");

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

    private async updateImageSizeInfo(image64: string, imageInfo: IImageInfo) {
        if (image64.length > 10) {
            const assetProps = await HtmlFileReader.readAssetAttributesWithBuffer(image64);
            if (assetProps) {
                imageInfo.width = assetProps.width;
                imageInfo.height = assetProps.height;
            } else {
                console.log("imageInfo not found");
            }
        }
    }

    private updateAssetTagArrays(element: IAssetMetadata, imageInfo: IImageInfo) {
        element.regions.filter((region) => (region.type === RegionType.Rectangle ||
                                                   region.type === RegionType.Square) &&
                                                   region.points.length === 2)
                               .forEach((region) => {
                                    region.tags.forEach((tag) => {
                                        imageInfo.name.push(tag.name);
                                        imageInfo.xmin.push(region.points[0].x);
                                        imageInfo.ymin.push(region.points[0].y);
                                        imageInfo.xmax.push(region.points[1].x);
                                        imageInfo.ymax.push(region.points[1].y);
                                    });
                                });
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
