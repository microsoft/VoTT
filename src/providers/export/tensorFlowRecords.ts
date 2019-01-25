import _ from "lodash";
import CryptoJS from "crypto-js";
import axios from "axios";
import { ExportProvider, ExportAssetState } from "./exportProvider";
import { IProject, AssetState, AssetType, IAsset,
         IAssetMetadata, RegionType, ITag } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import Guard from "../../common/guard";
import HtmlFileReader from "../../common/htmlFileReader";
import { itemTemplate, annotationTemplate, objectTemplate } from "./tensorFlowPascalVOC/tensorFlowPascalVOCTemplates";
import { strings, interpolate } from "../../common/strings";
import { TFRecordsImageMessage, Features, Feature, FeatureList,
         BytesList, Int64List, FloatList } from "./tensorFlowRecords/tensorFlowRecordsProtoBuf_pb";
import { crc32c, maskCrc, getInt64Buffer, getInt32Buffer } from "./tensorFlowRecords/tensorFlowHelpers";

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
    text: string[];
    label: number[];
    xmin: number[];
    ymin: number[];
    xmax: number[];
    ymax: number[];
    difficult: number[];
    truncated: number[];
    view: string[];
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

    private addIntFeature(features: Features, key: string, value: number) {
        const intList = new Int64List();
        intList.addValue(value);

        const feature = new Feature();
        feature.setInt64List(intList);

        const featuresMap = features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    private addIntArrayFeature(features: Features, key: string, values: number[]) {
        const intList = new Int64List();
        values.forEach((value) => {
            intList.addValue(value);
        });

        const feature = new Feature();
        feature.setInt64List(intList);

        const featuresMap = features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    private addFloatArrayFeature(features: Features, key: string, values: number[]) {
        const floatList = new FloatList();
        values.forEach((value) => {
            floatList.addValue(value);
        });

        const feature = new Feature();
        feature.setFloatList(floatList);

        const featuresMap = features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    private addStringFeature(features: Features, key: string, value: string) {
        this.addBinaryArrayFeature(features, key, this.textEncode(value));
    }

    private addBinaryArrayFeature(features: Features, key: string, value: Uint8Array) {
        const byteList = new BytesList();
        byteList.addValue(value);

        const feature = new Feature();
        feature.setBytesList(byteList);

        const featuresMap = features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    private addStringArrayFeature(features: Features, key: string, values: string[]) {
        const byteList = new BytesList();
        values.forEach((value) => {
            byteList.addValue(this.textEncode(value));
        });

        const feature = new Feature();
        feature.setBytesList(byteList);

        const featuresMap = features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    private async writeTFRecord(fileNamePath: string, features: Features) {
        try {
            // Get Protocol Buffer TFRecords object with exported image features
            const imageMessage = new TFRecordsImageMessage();
            imageMessage.setContext(features);

            // Serialize Protocol Buffer in a buffer
            const bytes = imageMessage.serializeBinary();
            const bufferData = new Buffer(bytes);
            const length = bufferData.length;

            // Get TFRecords CRCs for TFRecords Header and Footer
            const bufferLength = getInt64Buffer(length);
            const bufferLengthMaskedCRC = getInt32Buffer(maskCrc(crc32c(bufferLength)));
            const bufferDataMaskedCRC = getInt32Buffer(maskCrc(crc32c(bufferData)));

            // Concatenate all TFRecords Header, Data and Footer buffer
            const outBuffer = Buffer.concat([bufferLength,
                                             bufferLengthMaskedCRC,
                                             bufferData,
                                             bufferDataMaskedCRC]);

            // Write TFRecords
            await this.storageProvider.writeBinary(fileNamePath, outBuffer);

        } catch (error) {
            // Ignore the error at the moment
            // TODO: Refactor ExportProvider abstract class export() method
            //       to return Promise<object> with an object containing
            //       the number of files succesfully exported out of total
            console.log(`Error Writing TFRecords ${fileNamePath} - ${error}`);
        }
    }

    private async exportRecords(exportFolderName: string, allAssets: IAssetMetadata[]) {
        const allImageExports = allAssets.map((element) => {
            return this.exportSingleRecord(exportFolderName, element);
        });

        await Promise.all(allImageExports);
    }

    private async exportSingleRecord(exportFolderName: string, element: IAssetMetadata): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const imageBuffer = await HtmlFileReader.getAssetArray(element.asset);

                // Get Base64
                const image64 = btoa(imageBuffer.reduce((data, byte) => data + String.fromCharCode(byte), ""));

                const imageInfo: IImageInfo = {
                    width: element.asset.size ? element.asset.size.width : 0,
                    height: element.asset.size ? element.asset.size.height : 0,
                    text: [],
                    label: [],
                    xmin: [],
                    ymin: [],
                    xmax: [],
                    ymax: [],
                    difficult: [],
                    truncated: [],
                    view: [],
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
                this.addStringFeature(features, "image/key/sha256", CryptoJS.SHA256(imageBuffer)
                    .toString(CryptoJS.enc.Base64));
                this.addBinaryArrayFeature(features, "image/encoded", imageBuffer);
                this.addStringFeature(features, "image/format", element.asset.name.split(".").pop());
                this.addFloatArrayFeature(features, "image/object/bbox/xmin", imageInfo.xmin);
                this.addFloatArrayFeature(features, "image/object/bbox/ymin", imageInfo.ymin);
                this.addFloatArrayFeature(features, "image/object/bbox/xmax", imageInfo.xmax);
                this.addFloatArrayFeature(features, "image/object/bbox/ymax", imageInfo.ymax);
                this.addStringArrayFeature(features, "image/object/class/text", imageInfo.text);
                this.addIntArrayFeature(features, "image/object/class/label", imageInfo.label);
                this.addIntArrayFeature(features, "image/object/difficult", imageInfo.difficult);
                this.addIntArrayFeature(features, "image/object/truncated", imageInfo.truncated);
                this.addStringArrayFeature(features, "image/object/view", imageInfo.view);

                // Save TFRecord
                const fileName = element.asset.name.split(".").slice(0, -1).join(".");
                const fileNamePath = `${exportFolderName}/${fileName}.tfrecord`;
                await this.writeTFRecord(fileNamePath, features);

                resolve();
            } catch (error) {
                // Ignore the error at the moment
                // TODO: Refactor ExportProvider abstract class export() method
                //       to return Promise<object> with an object containing
                //       the number of files succesfully exported out of total
                console.log(`Error downloading ${element.asset.path} - ${error}`);
                resolve();
                // eject(err);
            }
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
                                        const index = this.project.tags.map((pTag) => pTag.name).indexOf(tag.name);

                                        imageInfo.text.push(tag.name);
                                        imageInfo.label.push(index);
                                        imageInfo.xmin.push(region.points[0].x);
                                        imageInfo.ymin.push(region.points[0].y);
                                        imageInfo.xmax.push(region.points[1].x);
                                        imageInfo.ymax.push(region.points[1].y);
                                        imageInfo.difficult.push(0);
                                        imageInfo.truncated.push(0);
                                        imageInfo.view.push("Unspecified");
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

    private textEncode(str: string): Uint8Array {
        const utf8 = unescape(encodeURIComponent(str));
        const result = new Uint8Array(utf8.length);
        for (let i = 0; i < utf8.length; i++) {
            result[i] = utf8.charCodeAt(i);
        }
        return result;
    }
}
