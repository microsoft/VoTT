import _ from "lodash";
import CryptoJS from "crypto-js";
import { ExportProvider } from "./exportProvider";
import { IProject, IAssetMetadata, IExportProviderOptions } from "../../models/applicationState";
import Guard from "../../common/guard";
import HtmlFileReader from "../../common/htmlFileReader";
import { itemTemplate } from "./pascalVOC/pascalVOCTemplates";
import { interpolate } from "../../common/strings";
import { TFRecordsBuilder, FeatureType } from "./tensorFlowRecords/tensorFlowBuilder";

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
export class TFRecordsExportProvider extends ExportProvider {
    constructor(project: IProject, options: IExportProviderOptions) {
        super(project, options);
        Guard.null(options);
    }

    /**
     * Export project to TensorFlow Records
     */
    public async export(): Promise<void> {
        const allAssets = await this.getAssetsForExport();
        const exportObject: any = { ...this.project };
        exportObject.assets = _.keyBy(allAssets, (assetMetadata) => assetMetadata.asset.id);

        // Create Export Folder
        const exportFolderName = `${this.project.name.replace(/\s/g, "-")}-TFRecords-export`;
        await this.storageProvider.createContainer(exportFolderName);

        await this.exportPBTXT(exportFolderName, this.project);
        await this.exportRecords(exportFolderName, allAssets);
    }

    private async exportRecords(exportFolderName: string, allAssets: IAssetMetadata[]) {
        return await allAssets.mapAsync(async (element) => {
            return await this.exportSingleRecord(exportFolderName, element);
        });
    }

    private async exportSingleRecord(exportFolderName: string, element: IAssetMetadata): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const arrayBuffer = await HtmlFileReader.getAssetArray(element.asset);
                const imageBuffer = new Uint8Array(arrayBuffer);

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
                const builder = new TFRecordsBuilder();

                builder.addFeature("image/height", FeatureType.Int64, imageInfo.height);
                builder.addFeature("image/width", FeatureType.Int64, imageInfo.width);
                builder.addFeature("image/filename", FeatureType.String, element.asset.name);
                builder.addFeature("image/source_id", FeatureType.String, element.asset.name);
                builder.addFeature("image/key/sha256", FeatureType.String, CryptoJS.SHA256(imageBuffer)
                    .toString(CryptoJS.enc.Base64));
                builder.addFeature("image/encoded", FeatureType.Binary, imageBuffer);
                builder.addFeature("image/format", FeatureType.String, element.asset.name.split(".").pop());
                builder.addArrayFeature("image/object/bbox/xmin", FeatureType.Float, imageInfo.xmin);
                builder.addArrayFeature("image/object/bbox/ymin", FeatureType.Float, imageInfo.ymin);
                builder.addArrayFeature("image/object/bbox/xmax", FeatureType.Float, imageInfo.xmax);
                builder.addArrayFeature("image/object/bbox/ymax", FeatureType.Float, imageInfo.ymax);
                builder.addArrayFeature("image/object/class/text", FeatureType.String, imageInfo.text);
                builder.addArrayFeature("image/object/class/label", FeatureType.Int64, imageInfo.label);
                builder.addArrayFeature("image/object/difficult", FeatureType.Int64, imageInfo.difficult);
                builder.addArrayFeature("image/object/truncated", FeatureType.Int64, imageInfo.truncated);
                builder.addArrayFeature("image/object/view", FeatureType.String, imageInfo.view);

                // Save TFRecords
                const fileName = element.asset.name.split(".").slice(0, -1).join(".");
                const fileNamePath = `${exportFolderName}/${fileName}.tfrecord`;
                await this.writeTFRecords(fileNamePath, [builder.build()]);

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

    private async writeTFRecords(fileNamePath: string, buffers: Buffer[]) {
        // Get TFRecords buffer
        const tfRecords = TFRecordsBuilder.buildTFRecords(buffers);

        // Write TFRecords
        await this.storageProvider.writeBinary(fileNamePath, tfRecords);
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
        element.regions.filter((region) => region.boundingBox)
            .forEach((region) => {
                region.tags.forEach((tagName) => {
                    const index = this.project.tags
                        .findIndex((projectTag) => projectTag.name === tagName);

                    imageInfo.text.push(tagName);
                    imageInfo.label.push(index);
                    imageInfo.xmin.push(region.boundingBox.left / imageInfo.width);
                    imageInfo.ymin.push(region.boundingBox.top / imageInfo.height);
                    imageInfo.xmax.push((region.boundingBox.left + region.boundingBox.width)
                        / imageInfo.width);
                    imageInfo.ymax.push((region.boundingBox.top + region.boundingBox.height)
                        / imageInfo.height);
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
}
