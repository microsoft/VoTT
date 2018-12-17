import _ from "lodash";
import { ExportProvider } from "./exportProvider";
import { IProject, AssetState, AssetType, IAsset } from "../../models/applicationState";
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

        const folderName = `${this.project.name.replace(" ", "-")}-TFPascalVOC-export`;
        await this.storageProvider.createContainer(folderName);

        const fileName = `${folderName}/file.json`;
        await this.storageProvider.writeText(fileName, JSON.stringify(exportObject, null, 4));
    }
}
