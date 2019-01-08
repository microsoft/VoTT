import _ from "lodash";
import { ExportProvider, ExportAssetState } from "./exportProvider";
import { IProject, AssetState, AssetType, IAsset, IAssetMetadata } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import Guard from "../../common/guard";
import axios from "axios";

/**
 * @name - ITFPascalVOCJsonExportOptions
 * @description - Defines the configurable options for the Vott JSON Export provider
 */
export interface ITFPascalVOCJsonExportOptions {
    assetState: ExportAssetState;
}

interface IImageInfo {
    width: number;
    height: number;
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
            const imageFileName = `${jpegImagesFolderName}/${element.asset.name}`;

            return new Promise((resolve, reject) => {
                // Get image
                axios.get(element.asset.path, {
                    responseType: "arraybuffer",
                })
                .then(async (response) => {
                    // Get buffer
                    const buffer = new Buffer(response.data);

                    // Write Binary
                    await this.storageProvider.writeBinary(imageFileName, buffer);

                    // Get Base64
                    const image64 = btoa(new Uint8Array(response.data).
                        reduce((data, byte) => data + String.fromCharCode(byte), ""));

                    if (image64.length > 10) {
                        // Load image at runtime to get dimension info
                        const img = new Image();
                        img.onload = ((event) => {
                            const imageInfo: IImageInfo = {
                                width: img.width,
                                height: img.height,
                            };

                            this.imagesInfo.set(element.asset.name, imageInfo);

                            resolve();
                        });
                        img.onerror = ((err) => {
                            // Ignore the error at the moment
                            // TODO: Refactor ExportProvider abstract class export() method
                            //       to return Promise<object> with an object containing
                            //       the number of files succesfully exported out of total
                            console.log(`Error loading image ${imageFileName}`);
                            resolve();
                            // eject(err);
                        });
                        img.src = "data:image/jpeg;base64," + image64;
                    } else {
                        // Ignore the error at the moment
                        // TODO: Refactor ExportProvider abstract class export() method
                        //       to return Promise<object> with an object containing
                        //       the number of files succesfully exported out of total
                        console.log(`Image not valid ${imageFileName}`);
                        resolve();
                        // eject(err);
                    }
                })
                .catch((err) => {
                    // Ignore the error at the moment
                    // TODO: Refactor ExportProvider abstract class export() method
                    //       to return Promise<object> with an object containing
                    //       the number of files succesfully exported out of total
                    console.log(`Error downloading ${imageFileName}`);
                    resolve();
                    // eject(err);
                });
            });
        });

        try {
            await Promise.all(allImageExports);
        } catch (err) {
            console.log(err);
        }
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
    <name>%OBJECT_CLASS%</name>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>0</difficult>
    <bndbox>
        <xmin>%OBJECT_TAG_x1%</xmin>
        <ymin>%OBJECT_TAG_y1%</ymin>
        <xmax>%OBJECT_TAG_x2%</xmax>
        <ymax>%OBJECT_TAG_y2%</ymax>
    </bndbox>
</object>`;

        const allAnnotationExports = [];  // Promise[] ?????

        // Save Annotations
        this.imagesInfo.forEach((imageInfo, imageName) => {
            allAnnotationExports.push(
                new Promise((resolve, reject) => {
                    const filePath = `${annotationsFolderName}/${imageName}`;

                    const annotationXML = annotationTemplate.replace("%FILE_NAME%", imageName)
                                                          .replace("%FILE_PATH%", filePath)
                                                          .replace("%WIDTH%", imageInfo.width.toString())
                                                          .replace("%HEIGHT%", imageInfo.height.toString());

                    // TODO : Objects

                    console.log(imageName, annotationXML);

                    // TODO : Save Annotation File

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

        // Save ImageSets (Main ?)
        // TODO
    }
}
