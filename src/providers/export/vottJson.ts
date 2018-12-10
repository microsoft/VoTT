import _ from "lodash";
import { ExportProvider } from "./exportProvider";
import { IProject, AssetState, AssetType, IAsset } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import Guard from "../../common/guard";

/**
 * @name - Vott Export Asset State
 * @description - Defines the asset type export option
 * @member All - Specifies that all assets will be exported
 * @member Visited - Specifies that visited (including tagged) assets will be exported
 * @member Tagged - Specifies that only tagged assets will be exported
 */
export enum VottExportAssetState {
    All = "all",
    Visited = "visited",
    Tagged = "tagged",
}

/**
 * @name - IVottJsonExportOptions
 * @description - Defines the configurable options for the Vott JSON Export provider
 */
export interface IVottJsonExportOptions {
    assetState: VottExportAssetState;
}

/**
 * @name - Vott Json Export Provider
 * @description - Exports a project into a single JSON file that include all configured assets
 */
export class VottJsonExportProvider extends ExportProvider<IVottJsonExportOptions> {
    constructor(project: IProject, options: IVottJsonExportOptions) {
        super(project, options);
        Guard.null(options);
    }

    public async export(): Promise<void> {
        const assetService = new AssetService(this.project);

        let predicate: (asset: IAsset) => boolean = null;

        switch (this.options.assetState) {
            case VottExportAssetState.All:
                predicate = (asset) => true;
                break;
            case VottExportAssetState.Visited:
                predicate = (asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged;
                break;
            case VottExportAssetState.Tagged:
                predicate = (asset) => asset.state === AssetState.Tagged;
                break;
        }

        const loadAssetTasks = _.values(this.project.assets)
            .filter(predicate)
            .map((asset) => assetService.getAssetMetadata(asset));

        const results = await Promise.all(loadAssetTasks);
        const exportObject: any = { ...this.project };
        exportObject.assets = _.keyBy(results, (assetMetadata) => assetMetadata.asset.id);

        const fileName = `${this.project.name.replace(" ", "-")}-export.json`;
        await this.storageProvider.writeText(fileName, JSON.stringify(exportObject, null, 4));
    }
}
