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

/**
 * @name - TFPascalVOC Json Export Provider
 * @description - Exports a project into a single JSON file that include all configured assets
 */
export class TFPascalVOCJsonExportProvider extends ExportProvider<ITFPascalVOCJsonExportOptions> {
    constructor(project: IProject, options: ITFPascalVOCJsonExportOptions) {
        super(project, options);
        Guard.null(options);
    }

    /**
     * Export project to TensorFlow PascalVOC
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
                            // TODO: Save on a temporary Dictionary width, height, depth
                            //       to be used later in exportAnnotations()
                            console.log(img.width);

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

        // Save Annotations
        // TODO
    }

    private async exportImageSets(exportFolderName: string, allAssets: IAssetMetadata[]) {
        // Create ImageSets Sub Folder (Main ?)
        const imageSetsFolderName = `${exportFolderName}/ImageSets`;
        await this.storageProvider.createContainer(imageSetsFolderName);

        // Save ImageSets (Main ?)
        // TODO
    }
}
