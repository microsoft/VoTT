import _ from "lodash";
import { ExportProvider } from "./exportProvider";
import { IProject, AssetState, AssetType, IAsset, IAssetMetadata } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import Guard from "../../common/guard";

/**
 * @name - TF Pascal VOC Records Export Asset State
 * @description - Defines the asset type export option
 * @member All - Specifies that all assets will be exported
 * @member Visited - Specifies that visited (including tagged) assets will be exported
 * @member Tagged - Specifies that only tagged assets will be exported
 */
export enum TFPascalVOCExportAssetState {
    All = "all",
    Visited = "visited",
    Tagged = "tagged",
}

/**
 * @name - ITFPascalVOCJsonExportOptions
 * @description - Defines the configurable options for the Vott JSON Export provider
 */
export interface ITFPascalVOCJsonExportOptions {
    assetState: TFPascalVOCExportAssetState;
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

    public async export(): Promise<void> {
        const assetService = new AssetService(this.project);

        let predicate: (asset: IAsset) => boolean = null;

        switch (this.options.assetState) {
            case TFPascalVOCExportAssetState.All:
                predicate = (asset) => true;
                break;
            case TFPascalVOCExportAssetState.Visited:
                predicate = (asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged;
                break;
            case TFPascalVOCExportAssetState.Tagged:
                predicate = (asset) => asset.state === AssetState.Tagged;
                break;
        }

        const loadAssetTasks = _.values(this.project.assets)
            .filter(predicate)
            .map((asset) => assetService.getAssetMetadata(asset));

        const results = await Promise.all(loadAssetTasks);
        const exportObject: any = { ...this.project };
        exportObject.assets = _.keyBy(results, (assetMetadata) => assetMetadata.asset.id);

        // Create Export Folder
        const exportFolderName = `${this.project.name.replace(" ", "-")}-TFPascalVOC-export`;
        await this.storageProvider.createContainer(exportFolderName);

        await this.exporAnnotations(exportFolderName, results);
        await this.exportImageSets(exportFolderName, results);
        await this.exportImages(exportFolderName, results);
        await this.exportPBTXT(exportFolderName, results);
    }

    private async exportImages(exportFolderName: string, results: IAssetMetadata[]) {
        // Create JPEGImages Sub Folder
        const jpegImagesFolderName = `${exportFolderName}/JPEGImages`;
        await this.storageProvider.createContainer(jpegImagesFolderName);

        const allImgaeExports = results.map((element) => {
            const imageFileName = `${jpegImagesFolderName}/${element.asset.name}`;

            return new Promise((resolve, reject) => {
                // Get image
                fetch(element.asset.path)
                .then(async (response) => {
                    // Get buffer
                    const buffer = new Buffer(await response.arrayBuffer());

                    // Write Binary
                    await this.storageProvider.writeBinary(imageFileName, buffer);

                    resolve();
                })
                .catch((err) => {
                    console.log(`Error downloading ${imageFileName}`);
                    reject(err);
                });
            });
        });

        try {
            await Promise.all(allImgaeExports);
        } catch (err) {
            // Ignore the error at the moment
            // TODO: Refactor ExportProvider abstract class export() method
            //       to return Promise<object> with an object containing
            //       the number of files succesfully exported out of total
            console.log(err);
        }
    }

    private async exporAnnotations(exportFolderName: string, results: IAssetMetadata[]) {
        // Create Annotations Sub Folder
        const annotationsFolderName = `${exportFolderName}/Annotations`;
        await this.storageProvider.createContainer(annotationsFolderName);

        // Save Annotations
        // TODO
    }

    private async exportImageSets(exportFolderName: string, results: IAssetMetadata[]) {
        // Create ImageSets Sub Folder (Main ?)
        const imageSetsFolderName = `${exportFolderName}/ImageSets`;
        await this.storageProvider.createContainer(imageSetsFolderName);

        // Save ImageSets (Main ?)
        // TODO
    }

    private async exportPBTXT(exportFolderName: string, results: IAssetMetadata[]) {
        // Save pascal_label_map.pbtxt
        const pbtxtFileName = `${exportFolderName}/pascal_label_map.pbtxt`;

        // TODO
        await this.storageProvider.writeText(pbtxtFileName, JSON.stringify("TODO", null, 4));
    }
}
