import _ from "lodash";
import { ExportProvider } from "./exportProvider";
import { IProject, IAssetMetadata, ITag, IExportProviderOptions } from "../../models/applicationState";
import Guard from "../../common/guard";
import HtmlFileReader from "../../common/htmlFileReader";
import { itemTemplate, annotationTemplate, objectTemplate } from "./pascalVOC/pascalVOCTemplates";
import { interpolate } from "../../common/strings";
import os from "os";
import { splitTestAsset } from "./testAssetsSplitHelper";

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
 * Export options for Pascal VOC Export Provider
 */
export interface IPascalVOCExportProviderOptions extends IExportProviderOptions {
    /** The test / train split ratio for exporting data */
    testTrainSplit?: number;
    /** Whether or not to include unassigned tags in exported data */
    exportUnassigned?: boolean;
}

/**
 * @name - PascalVOC Export Provider
 * @description - Exports a project into a Pascal VOC
 */
export class PascalVOCExportProvider extends ExportProvider<IPascalVOCExportProviderOptions> {
    private imagesInfo = new Map<string, IImageInfo>();

    constructor(project: IProject, options: IPascalVOCExportProviderOptions) {
        super(project, options);
        Guard.null(options);
    }

    /**
     * Export project to PascalVOC
     */
    public async export(): Promise<void> {
        const allAssets = await this.getAssetsForExport();
        const exportObject: any = { ...this.project };
        exportObject.assets = _.keyBy(allAssets, (assetMetadata) => assetMetadata.asset.id);

        // Create Export Folder
        const exportFolderName = `${this.project.name.replace(/\s/g, "-")}-PascalVOC-export`;
        await this.storageProvider.createContainer(exportFolderName);

        await this.exportImages(exportFolderName, allAssets);
        await this.exportPBTXT(exportFolderName, this.project);
        await this.exportAnnotations(exportFolderName, allAssets);

        // TestSplit && exportUnassignedTags are optional parameter in the UI Exporter configuration
        const testSplit = (100 - (this.options.testTrainSplit || 80)) / 100;
        await this.exportImageSets(
            exportFolderName,
            allAssets,
            this.project.tags,
            testSplit,
            this.options.exportUnassigned,
        );
    }

    private async exportImages(exportFolderName: string, allAssets: IAssetMetadata[]) {
        // Create JPEGImages Sub Folder
        const jpegImagesFolderName = `${exportFolderName}/JPEGImages`;
        await this.storageProvider.createContainer(jpegImagesFolderName);

        await allAssets.mapAsync(async (assetMetadata) => {
            await this.exportSingleImage(jpegImagesFolderName, assetMetadata);
        });
    }

    private async exportSingleImage(jpegImagesFolderName: string, assetMetadata: IAssetMetadata): Promise<void> {
        try {
            const arrayBuffer = await HtmlFileReader.getAssetArray(assetMetadata.asset);
            const buffer = Buffer.from(arrayBuffer);
            const imageFileName = `${jpegImagesFolderName}/${assetMetadata.asset.name}`;

            // Write Binary
            await this.storageProvider.writeBinary(imageFileName, buffer);

            // Get Array of all Box shaped tag for the Asset
            const tagObjects = this.getAssetTagArray(assetMetadata);

            const imageInfo: IImageInfo = {
                width: assetMetadata.asset.size ? assetMetadata.asset.size.width : 0,
                height: assetMetadata.asset.size ? assetMetadata.asset.size.height : 0,
                objects: tagObjects,
            };

            this.imagesInfo.set(assetMetadata.asset.name, imageInfo);

            if (!assetMetadata.asset.size ||
                assetMetadata.asset.size.width === 0 ||
                assetMetadata.asset.size.height === 0) {
                await this.updateImageSizeInfo(arrayBuffer, imageFileName, assetMetadata.asset.name);
            }
        } catch (err) {
            // Ignore the error at the moment
            // TODO: Refactor ExportProvider abstract class export() method
            //       to return Promise<object> with an object containing
            //       the number of files successfully exported out of total
            console.log(`Error downloading asset ${assetMetadata.asset.path} - ${err}`);
        }
    }

    private getAssetTagArray(element: IAssetMetadata): IObjectInfo[] {
        const tagObjects = [];
        element.regions.forEach((region) => {
            region.tags.forEach((tagName) => {
                const objectInfo: IObjectInfo = {
                    name: tagName,
                    xmin: region.boundingBox.left,
                    ymin: region.boundingBox.top,
                    xmax: region.boundingBox.left + region.boundingBox.width,
                    ymax: region.boundingBox.top + region.boundingBox.height,
                };

                tagObjects.push(objectInfo);
            });
        });

        return tagObjects;
    }

    private async updateImageSizeInfo(imageBuffer: ArrayBuffer, imageFileName: string, assetName: string) {
        // Get Base64
        const image64 = btoa(new Uint8Array(imageBuffer).
            reduce((data, byte) => data + String.fromCharCode(byte), ""));

        if (image64.length < 10) {
            // Ignore the error at the moment
            // TODO: Refactor ExportProvider abstract class export() method
            //       to return Promise<object> with an object containing
            //       the number of files successfully exported out of total
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
            // Save pascal_label_map.pbtxt
            const pbtxtFileName = `${exportFolderName}/pascal_label_map.pbtxt`;

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

    private async exportAnnotations(exportFolderName: string, allAssets: IAssetMetadata[]) {
        // Create Annotations Sub Folder
        const annotationsFolderName = `${exportFolderName}/Annotations`;
        await this.storageProvider.createContainer(annotationsFolderName);

        try {
            // Save Annotations
            await this.imagesInfo.forEachAsync(async (imageInfo, imageName) => {
                const imageFilePath = `${annotationsFolderName}/${imageName}`;
                const assetFilePath = `${imageFilePath.substr(0, imageFilePath.lastIndexOf("."))
                    || imageFilePath}.xml`;

                const objectsXML = imageInfo.objects.map((o) => {
                    const params = {
                        name: o.name,
                        xmin: o.xmin.toString(),
                        ymin: o.ymin.toString(),
                        xmax: o.xmax.toString(),
                        ymax: o.ymax.toString(),
                    };

                    return interpolate(objectTemplate, params);
                });

                const params = {
                    fileName: imageName,
                    filePath: imageFilePath,
                    width: imageInfo.width.toString(),
                    height: imageInfo.height.toString(),
                    objects: objectsXML.join(""),
                };

                // Save Annotation File
                await this.storageProvider.writeText(assetFilePath, interpolate(annotationTemplate, params));
            });
        } catch (err) {
            console.log("Error writing Pascal VOC annotation file");
        }
    }

    private async exportImageSets(
        exportFolderName: string,
        allAssets: IAssetMetadata[],
        tags: ITag[],
        testSplit: number,
        exportUnassignedTags: boolean) {
        if (!tags) {
            return;
        }

        // Create ImageSets Sub Folder (Main ?)
        const imageSetsFolderName = `${exportFolderName}/ImageSets`;
        await this.storageProvider.createContainer(imageSetsFolderName);

        const imageSetsMainFolderName = `${exportFolderName}/ImageSets/Main`;
        await this.storageProvider.createContainer(imageSetsMainFolderName);

        const assetUsage = new Map<string, Set<string>>();
        const tagUsage = new Map<string, number>();

        // Generate tag usage per asset
        allAssets.forEach((assetMetadata) => {
            const appliedTags = new Set<string>();
            assetUsage.set(assetMetadata.asset.name, appliedTags);

            if (assetMetadata.regions.length > 0) {
                assetMetadata.regions.forEach((region) => {
                    tags.forEach((tag) => {
                        let tagInstances = tagUsage.get(tag.name) || 0;
                        if (region.tags.filter((tagName) => tagName === tag.name).length > 0) {
                            appliedTags.add(tag.name);
                            tagUsage.set(tag.name, tagInstances += 1);
                        }
                    });
                });
            }
        });

        if (testSplit > 0 && testSplit <= 1) {
            const tags = this.project.tags;
            const testAssets: string[] = splitTestAsset(allAssets, tags, testSplit);

            await tags.forEachAsync(async (tag) => {
                const tagInstances = tagUsage.get(tag.name) || 0;
                if (!exportUnassignedTags && tagInstances === 0) {
                    return;
                }
                const testArray = [];
                const trainArray = [];
                assetUsage.forEach((tags, assetName) => {
                    let assetString = "";
                    if (tags.has(tag.name)) {
                        assetString = `${assetName} 1`;
                    } else {
                        assetString = `${assetName} -1`;
                    }
                    if (testAssets.find((am) => am === assetName)) {
                        testArray.push(assetString);
                    } else {
                        trainArray.push(assetString);
                    }
                });

                const testImageSetFileName = `${imageSetsMainFolderName}/${tag.name}_val.txt`;
                await this.storageProvider.writeText(testImageSetFileName, testArray.join(os.EOL));

                const trainImageSetFileName = `${imageSetsMainFolderName}/${tag.name}_train.txt`;
                await this.storageProvider.writeText(trainImageSetFileName, trainArray.join(os.EOL));
            });
        } else {

            // Save ImageSets
            await tags.forEachAsync(async (tag) => {
                const tagInstances = tagUsage.get(tag.name) || 0;
                if (!exportUnassignedTags && tagInstances === 0) {
                    return;
                }

                const assetList = [];
                assetUsage.forEach((tags, assetName) => {
                    if (tags.has(tag.name)) {
                        assetList.push(`${assetName} 1`);
                    } else {
                        assetList.push(`${assetName} -1`);
                    }
                });

                const imageSetFileName = `${imageSetsMainFolderName}/${tag.name}.txt`;
                await this.storageProvider.writeText(imageSetFileName, assetList.join(os.EOL));
            });
        }
    }
}
