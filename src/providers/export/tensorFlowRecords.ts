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
         BytesList, Int64List, FeatureList, FeatureLists } from "./tensorFlowRecords/tensorFlowRecordsProtoBuf_pb";
import CryptoJS from "crypto-js";
import CRC32 from "crc-32";
import { systemErrorRetryPolicy } from "@azure/ms-rest-js";
import { SystemErrorRetryPolicy } from "@azure/ms-rest-js/es/lib/policies/systemErrorRetryPolicy";

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

    private addIntFeature(features: Features, key: string, value: number) {
        const intList = new Int64List();
        intList.addValue(value);

        const feature = new Feature();
        feature.setInt64List(intList);

        const featuresMap = features.getFeatureMap();
        featuresMap.set(key, feature);
    }

    private addIntArrayFeatureList(featureLists: FeatureLists, key: string, values: number[]) {
        const featureList = new FeatureList();

        values.forEach((value) => {
            const intList = new Int64List();
            intList.addValue(value);

            const feature = new Feature();
            feature.setInt64List(intList);

            featureList.addFeature(feature);
        });

        const featureListsMap = featureLists.getFeatureListMap();
        featureListsMap.set(key, featureList);
    }

    private addStringArrayFeatureList(featureLists: FeatureLists, key: string, values: string[]) {
        const featureList = new FeatureList();

        values.forEach((value) => {
            const byteList = new BytesList();
            byteList.addValue(this.textEncode(value));

            const feature = new Feature();
            feature.setBytesList(byteList);

            featureList.addFeature(feature);
        });

        const featureListsMap = featureLists.getFeatureListMap();
        featureListsMap.set(key, featureList);
    }

    // CRC-masking function used by TensorFlow.
    private maskCrc(value: number): number {
        const kCrc32MaskDelta = 0xa282ead8;
        const fourGb = Math.pow(2, 32);

        return (((value >>> 15) | (value << 17)) + kCrc32MaskDelta) % fourGb;
    }

    private async writeTFRecord(fileNamePath: string, features: Features, featureLists: FeatureLists) {
        // A TFRecords file contains a sequence of strings with CRC
        // hashes. Each record has the format
        //
        //     uint64 length
        //     uint32 masked_crc32_of_length
        //     byte   data[length]
        //     uint32 masked_crc32_of_data
        //
        // and the records are concatenated together to produce the file. The
        // CRC32s are described here, and the mask of a CRC is
        //
        //     masked_crc = ((crc >> 15) | (crc << 17)) + 0xa282ead8ul
        //
        // For more information, please refer to
        // https://www.tensorflow.org/versions/master/api_docs/python/python_io.html#tfrecords-format-details.

        // maskDelta is a magic number taken from
        // https://github.com/tensorflow/tensorflow/blob/754048a0453a04a761e112ae5d99c149eb9910dd/
        //    tensorflow/core/lib/hash/crc32c.h#L33.
        // const maskDelta uint32 = 0xa282ead8

        // mask returns a masked representation of crc.
        const imageMessage = new TFRecordsImageMessage();
        imageMessage.setContext(features);
        imageMessage.setFeatureLists(featureLists);

        const bytes = imageMessage.serializeBinary();
        const bufferData = new Buffer(bytes);
        const length = bufferData.length;

        let lengthCRC = CRC32.buf([length]);
        let bufferCRC = CRC32.buf(bufferData);

        // Fix CRC32 bug sometimes returning negative number
        // https://github.com/h2non/jshashes/issues/11
        if (lengthCRC < 0) {
            lengthCRC = lengthCRC >>> 0;
        }
        if (bufferCRC < 0) {
            bufferCRC = bufferCRC >>> 0;
        }

        const lengthMaskedCRC = this.maskCrc(lengthCRC);
        const bufferMaskedCRC = this.maskCrc(bufferCRC);

        try {
            const bufferLength = Buffer.allocUnsafe(8);
            // Write 64bit Int with two write32 calls
            // https://stackoverflow.com/questions/14730980/nodejs-write-64bit-unsigned-integer-to-buffer
            bufferLength.writeUInt32LE(length >> 8, 0);      // write the high order bits (shifted over)
            bufferLength.writeUInt32LE(length & 0x00ff, 4);  // write the low order bits

            const bufferLengthMaskedCRC = Buffer.allocUnsafe(4);
            bufferLengthMaskedCRC.writeUInt32LE(lengthMaskedCRC, 0);

            const bufferDataMaskedCRC = Buffer.allocUnsafe(4);
            bufferDataMaskedCRC.writeUInt32LE(bufferMaskedCRC, 0);

            const outBuffer = Buffer.concat([bufferLength,
                                             bufferLengthMaskedCRC,
                                             bufferData,
                                             bufferDataMaskedCRC]);

            await this.storageProvider.writeBinary(fileNamePath, outBuffer);

        } catch (error) {
            console.log(error);
        }
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
                    text: [],
                    label: [],
                    xmin: [],
                    ymin: [],
                    xmax: [],
                    ymax: [],
                    view: [],
                };

                if (!element.asset.size || element.asset.size.width === 0 || element.asset.size.height === 0) {
                    await this.updateImageSizeInfo(image64, imageInfo);
                }

                // Get Array of all Box shaped tag for the Asset
                this.updateAssetTagArrays(element, imageInfo);

                // Generate TFRecord
                const features = new Features();
                const featureLists = new FeatureLists();

                this.addIntFeature(features, "image/height", imageInfo.height);
                this.addIntFeature(features, "image/width", imageInfo.width);
                this.addStringFeature(features, "image/filename", element.asset.name);
                this.addStringFeature(features, "image/source_id", element.asset.name);
                this.addStringFeature(features, "image/key/sha256", CryptoJS.SHA256(image64)
                    .toString(CryptoJS.enc.Base64));
                this.addStringFeature(features, "image/encoded", image64);
                this.addStringFeature(features, "image/format", element.asset.name.split(".").pop());
                this.addIntArrayFeatureList(featureLists, "image/object/bbox/xmin", imageInfo.xmin);
                this.addIntArrayFeatureList(featureLists, "image/object/bbox/ymin", imageInfo.ymin);
                this.addIntArrayFeatureList(featureLists, "image/object/bbox/xmax", imageInfo.xmax);
                this.addIntArrayFeatureList(featureLists, "image/object/bbox/ymax", imageInfo.ymax);
                this.addStringArrayFeatureList(featureLists, "image/object/class/text", imageInfo.text);
                this.addIntArrayFeatureList(featureLists, "image/object/class/label", imageInfo.label);
                this.addIntFeature(features, "image/object/difficult", 0);
                this.addIntFeature(features, "image/object/truncated", 0);
                this.addStringArrayFeatureList(featureLists, "image/object/view", imageInfo.view);

                // Save TFRecord
                const fileName = element.asset.name.split(".").slice(0, -1).join(".");
                const fileNamePath = `${exportFolderName}/${fileName}.tfrecord`;
                await this.writeTFRecord(fileNamePath, features, featureLists);

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
                                        imageInfo.text.push(tag.name);
                                        imageInfo.label.push(0); // TODO: Get tag position in global tags
                                        imageInfo.xmin.push(region.points[0].x);
                                        imageInfo.ymin.push(region.points[0].y);
                                        imageInfo.xmax.push(region.points[1].x);
                                        imageInfo.ymax.push(region.points[1].y);
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
