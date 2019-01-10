import _ from "lodash";
import { ExportProvider, ExportAssetState } from "./exportProvider";
import { IProject, AssetState, AssetType, IAsset, IAssetMetadata, RegionType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import Guard from "../../common/guard";
import HtmlFileReader from "../../common/htmlFileReader";
import axios from "axios";

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
        const exportFolderName = `${this.project.name.replace(" ", "-")}-TFPascalVOC-export`;
        await this.storageProvider.createContainer(exportFolderName);

        await this.exportImages(exportFolderName, allAssets);
        await this.exportPBTXT(exportFolderName, this.project);
        await this.exportAnnotations(exportFolderName, allAssets);
        await this.exportImageSets(exportFolderName, allAssets);
    }

    private async exportImages(exportFolderName: string, allAssets: IAssetMetadata[]) {
        // Create JPEGImages Sub Folder
        const jpegImagesFolderName = `${exportFolderName}/JPEGImages`;
        await this.storageProvider.createContainer(jpegImagesFolderName);

        const allImageExports = allAssets.map((element) => {
            return this.exportSingleImage(jpegImagesFolderName, element);
        });

        try {
            await Promise.all(allImageExports);
        } catch (err) {
            console.log(err);
        }
    }

    private async exportSingleImage(jpegImagesFolderName: string, element: IAssetMetadata): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const imageFileName = `${jpegImagesFolderName}/${element.asset.name}`;

            // Get image
            axios.get(element.asset.path, {
                responseType: "arraybuffer",
            })
            .then(async (response) => {
                // Get buffer
                const buffer = new Buffer(response.data);

                // Write Binary
                await this.storageProvider.writeBinary(imageFileName, buffer);

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

                const imageInfo: IImageInfo = {
                    width: element.asset.size ? element.asset.size.width : 0,
                    height: element.asset.size ? element.asset.size.height : 0,
                    objects: tagObjects,
                };

                this.imagesInfo.set(element.asset.name, imageInfo);

                if (!element.asset.size || element.asset.size.width === 0 || element.asset.size.height === 0) {
                    // Get Base64
                    const image64 = btoa(new Uint8Array(response.data).
                    reduce((data, byte) => data + String.fromCharCode(byte), ""));

                    if (image64.length < 10) {
                        // Ignore the error at the moment
                        // TODO: Refactor ExportProvider abstract class export() method
                        //       to return Promise<object> with an object containing
                        //       the number of files succesfully exported out of total
                        console.log(`Image not valid ${imageFileName}`);
                    } else {
                        const assetProps = await HtmlFileReader.readAssetAttributesWithBuffer(image64);
                        const imageInfo = this.imagesInfo.get(element.asset.name);
                        if (imageInfo && assetProps) {
                            imageInfo.width = assetProps.width;
                            imageInfo.height = assetProps.height;
                        } else {
                            console.log(`imageInfo for element ${element.asset.name} not found (${assetProps})`);
                        }
                    }
                }

                resolve();
            })
            .catch((err) => {
                // Ignore the error at the moment
                // TODO: Refactor ExportProvider abstract class export() method
                //       to return Promise<object> with an object containing
                //       the number of files succesfully exported out of total
                console.log(`Error downloading ${imageFileName} - ${err}`);
                resolve();
                // eject(err);
            });
        });
    }

    private async exportPBTXT(exportFolderName: string, project: IProject) {
        const itemTemplate = `
item {
    id: %ID%
    name: '%TAG%'
}`;

        if (project.tags && project.tags.length > 0) {
            // Save pascal_label_map.pbtxt
            const pbtxtFileName = `${exportFolderName}/pascal_label_map.pbtxt`;

            let id = 1;
            const items = project.tags.map((element) =>
                itemTemplate.replace("%ID%", (id++).toString()).replace("%TAG%", element.name));

            await this.storageProvider.writeText(pbtxtFileName, items.join());
        }
    }

    private async exportAnnotations(exportFolderName: string, allAssets: IAssetMetadata[]) {
        // Create Annotations Sub Folder
        const annotationsFolderName = `${exportFolderName}/Annotations`;
        await this.storageProvider.createContainer(annotationsFolderName);

        const annotationTemplate = `
<annotation verified="yes">
    <folder>Annotation</folder>
    <filename>%FILE_NAME%</filename>
    <path>%FILE_PATH%</path>
    <source>
        <database>Unknown</database>
    </source>
    <size>
        <width>%WIDTH%</width>
        <height>%HEIGHT%</height>
        <depth>3</depth>
    </size\>
    <segmented>0</segmented>
    %OBJECTS%
</annotation\>`;

        const objectTemplate = `
<object>
    <name>%OBJECT_TAG_NAME%</name>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>0</difficult>
    <bndbox>
        <xmin>%OBJECT_TAG_xmin%</xmin>
        <ymin>%OBJECT_TAG_ymin%</ymin>
        <xmax>%OBJECT_TAG_xmax%</xmax>
        <ymax>%OBJECT_TAG_ymax%</ymax>
    </bndbox>
</object>`;

        const allAnnotationExports = [];  // Promise[]

        // Save Annotations
        this.imagesInfo.forEach((imageInfo, imageName) => {
            allAnnotationExports.push(
                new Promise(async (resolve, reject) => {
                    const imageFilePath = `${annotationsFolderName}/${imageName}`;
                    const assetFilePath = `${imageFilePath.substr(0, imageFilePath.lastIndexOf("."))
                        || imageFilePath}.xml`;

                    const objectsXML = imageInfo.objects.map((o) => {
                        return objectTemplate.replace("%OBJECT_TAG_NAME%", o.name)
                                             .replace("%OBJECT_TAG_xmin%", o.xmin.toString())
                                             .replace("%OBJECT_TAG_ymin%", o.ymin.toString())
                                             .replace("%OBJECT_TAG_xmax%", o.xmax.toString())
                                             .replace("%OBJECT_TAG_ymax%", o.ymax.toString());
                    });

                    const annotationXML = annotationTemplate.replace("%FILE_NAME%", imageName)
                                                            .replace("%FILE_PATH%", imageFilePath)
                                                            .replace("%WIDTH%", imageInfo.width.toString())
                                                            .replace("%HEIGHT%", imageInfo.height.toString())
                                                            .replace("%OBJECTS%", objectsXML.join("\n"));

                    // Save Annotation File
                    await this.storageProvider.writeText(assetFilePath, annotationXML);

                    resolve();
                }),
            );
        });

        try {
            await Promise.all(allAnnotationExports);
        } catch (err) {
            console.log(err);
        }
    }

    private async exportImageSets(exportFolderName: string, allAssets: IAssetMetadata[]) {
        // Create ImageSets Sub Folder (Main ?)
        const imageSetsFolderName = `${exportFolderName}/ImageSets`;
        await this.storageProvider.createContainer(imageSetsFolderName);

        const imageSetsMainFolderName = `${exportFolderName}/ImageSets/Main`;
        await this.storageProvider.createContainer(imageSetsMainFolderName);

        // Save ImageSets (Main ?)
        // TODO
    }
}
