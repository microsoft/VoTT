import _ from "lodash";
import { ExportProvider, ExportAssetState } from "./exportProvider";
import { IProject, IAssetMetadata, RegionType, ITag } from "../../models/applicationState";
import Guard from "../../common/guard";
import HtmlFileReader from "../../common/htmlFileReader";
import { itemTemplate, annotationTemplate, objectTemplate } from "./tensorFlowPascalVOC/tensorFlowPascalVOCTemplates";
import { interpolate } from "../../common/strings";

/**
 * @name - ITFPascalVOCJsonExportOptions
 * @description - Defines the configurable options for the Vott JSON Export provider
 */
export interface ITFPascalVOCJsonExportOptions {
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
 * @name - TFPascalVOC Json Export Provider
 * @description - Exports a project into a single JSON file that include all configured assets
 */
export class TFPascalVOCJsonExportProvider extends ExportProvider<ITFPascalVOCJsonExportOptions> {
    private imagesInfo = new Map<string, IImageInfo>();

    constructor(project: IProject, options: ITFPascalVOCJsonExportOptions) {
        super(project, options);
        Guard.null(options);
    }

    /**
     * Export project to TensorFlow PascalVOC
     */
    public async export(): Promise<void> {
        const allAssets = await this.getAssetsForExport();
        const exportObject: any = { ...this.project };
        exportObject.assets = _.keyBy(allAssets, (assetMetadata) => assetMetadata.asset.id);

        // Create Export Folder
        const exportFolderName = `${this.project.name.replace(" ", "-")}-TFPascalVOC-export`;
        await this.storageProvider.createContainer(exportFolderName);

        await this.exportImages(exportFolderName, allAssets);
        await this.exportPBTXT(exportFolderName, this.project);
        await this.exportAnnotations(exportFolderName, allAssets);

        // TODO: Make testSplit && exportUnassignedTags optional parameter in the UI Exporter configuration
        await this.exportImageSets(exportFolderName, allAssets, this.project.tags, 0.2, true);
    }

    private async exportImages(exportFolderName: string, allAssets: IAssetMetadata[]) {
        // Create JPEGImages Sub Folder
        const jpegImagesFolderName = `${exportFolderName}/JPEGImages`;
        await this.storageProvider.createContainer(jpegImagesFolderName);

        try {
            await allAssets.mapAsync(async (element) => {
                await this.exportSingleImage(jpegImagesFolderName, element);
            });
        } catch (err) {
            console.log(err);
        }
    }

    private async exportSingleImage(jpegImagesFolderName: string, element: IAssetMetadata): Promise<void> {
        const imageFileName = `${jpegImagesFolderName}/${element.asset.name.replace(/\.[^/.]+$/, ".jpg")}`;

        try {
            const arrayBuffer = await HtmlFileReader.getAssetArray(element.asset);
            const buffer = Buffer.from(arrayBuffer);

            // Write Binary
            await this.storageProvider.writeBinary(imageFileName, buffer);

            // Get Array of all Box shaped tag for the Asset
            const tagObjects = this.getAssetTagArray(element);

            const imageInfo: IImageInfo = {
                width: element.asset.size ? element.asset.size.width : 0,
                height: element.asset.size ? element.asset.size.height : 0,
                objects: tagObjects,
            };

            this.imagesInfo.set(element.asset.name, imageInfo);

            if (!element.asset.size || element.asset.size.width === 0 || element.asset.size.height === 0) {
                await this.updateImageSizeInfo(arrayBuffer, imageFileName, element.asset.name);
            }
        } catch (err) {
            // Ignore the error at the moment
            // TODO: Refactor ExportProvider abstract class export() method
            //       to return Promise<object> with an object containing
            //       the number of files successfully exported out of total
            console.log(`Error downloading ${imageFileName} - ${err}`);
        }
    }

    private getAssetTagArray(element: IAssetMetadata): IObjectInfo[] {
        const tagObjects = [];
        element.regions.filter((region) => (region.type === RegionType.Rectangle ||
            region.type === RegionType.Square) &&
            region.points.length === 2)
            .forEach((region) => {
                region.tags.forEach((tagName) => {
                    const objectInfo: IObjectInfo = {
                        name: tagName,
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
            console.log(err);
        }
    }

    private async exportImageSets(
        exportFolderName: string,
        allAssets: IAssetMetadata[],
        tags: ITag[],
        testSplit: number,
        exportUnassignedTags: boolean) {
        // Create ImageSets Sub Folder (Main ?)
        const imageSetsFolderName = `${exportFolderName}/ImageSets`;
        await this.storageProvider.createContainer(imageSetsFolderName);

        const imageSetsMainFolderName = `${exportFolderName}/ImageSets/Main`;
        await this.storageProvider.createContainer(imageSetsMainFolderName);

        const tagsDict = new Map<string, string[]>();
        if (tags) {
            tags.forEach((tag) => {
                tagsDict.set(tag.name, []);
            });

            allAssets.forEach((asset) => {
                if (asset.regions.length > 0) {
                    asset.regions.forEach((region) => {
                        tags.forEach((tag) => {
                            const array = tagsDict.get(tag.name);
                            if (region.tags.filter((tagName) => tagName === tag.name).length > 0) {
                                array.push(`${asset.asset.name} 1`);
                            } else {
                                array.push(`${asset.asset.name} -1`);
                            }
                        });
                    });
                } else if (exportUnassignedTags) {
                    tags.forEach((tag) => {
                        const array = tagsDict.get(tag.name);
                        array.push(`${asset.asset.name} -1`);
                    });
                }
            });

            // Save ImageSets
            tags.forEach(async (tag) => {
                if (testSplit > 0 && testSplit <= 1) {
                    // Shuffle tagsDict sets
                    tagsDict.forEach((value, key) => {
                        value = this.shuffle(value);
                    });

                    const array = tagsDict.get(tag.name);

                    // Split in Test and Train sets
                    const totalAssets = array.length;
                    const testCount = Math.ceil(totalAssets * testSplit);

                    const testArray = array.slice(0, testCount);
                    const trainArray = array.slice(testCount, totalAssets);

                    const testImageSetFileName = `${imageSetsMainFolderName}/${tag.name}_val.txt`;
                    await this.storageProvider.writeText(testImageSetFileName, testArray.join("\n"));

                    const trainImageSetFileName = `${imageSetsMainFolderName}/${tag.name}_train.txt`;
                    await this.storageProvider.writeText(trainImageSetFileName, trainArray.join("\n"));

                } else {
                    const imageSetFileName = `${imageSetsMainFolderName}/${tag.name}.txt`;
                    await this.storageProvider.writeText(imageSetFileName, tagsDict.get(tag.name).join("\n"));
                }
            });
        }
    }

    private shuffle(a: any[]) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}
