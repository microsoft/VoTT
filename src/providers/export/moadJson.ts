import _ from "lodash";
import { ExportProvider } from "./exportProvider";
import { IProject, IExportProviderOptions } from "../../models/applicationState";
import Guard from "../../common/guard";
import { constants } from "../../common/constants";
import HtmlFileReader from "../../common/htmlFileReader";

/**
 * MOAD Json Export Provider options
 */
export interface IMoadJsonExportProviderOptions extends IExportProviderOptions {
    /** Whether or not to include binary assets in target connection */
    includeImages: boolean;
}

/**
 * @name - MOAD Json Export Provider
 * @description - Exports a project into a single JSON file that include all configured assets
 */
export class MoadJsonExportProvider extends ExportProvider<IMoadJsonExportProviderOptions> {
    constructor(project: IProject, options: IMoadJsonExportProviderOptions) {
        super(project, options);
        Guard.null(options);
    }

    /**
     * Export project to VoTT JSON format
     */
    public async export(): Promise<void> {
        const results = await this.getAssetsForExport();

        if (this.options.includeImages) {
            await results.forEachAsync(async (assetMetadata) => {
                const arrayBuffer = await HtmlFileReader.getAssetArray(assetMetadata.asset);
                const assetFilePath = `moad-json-export/${assetMetadata.asset.name}`;
                await this.storageProvider.writeBinary(assetFilePath, Buffer.from(arrayBuffer));
            });
        }

        const exportObject = { ...this.project };
        exportObject.assets = _.keyBy(results, (assetMetadata) => assetMetadata.asset.id) as any;

        // We don't need these fields in the export JSON
        delete exportObject.sourceConnection;
        delete exportObject.targetConnection;
        delete exportObject.exportFormat;

        const fileName = `moad-json-export/${this.project.name.replace(/\s/g, "-")}${constants.exportFileExtension}`;
        await this.storageProvider.writeText(fileName, JSON.stringify(exportObject, null, 4));
    }
}
