import _ from "lodash";
import { ExportProvider } from "./exportProvider";
import { IProject } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";

export interface IJsonExportOptions {
    foo: string;
}

export class JsonExportProvider extends ExportProvider<IJsonExportOptions> {
    constructor(project: IProject, options: IJsonExportOptions) {
        super(project, options);
    }

    public async export(): Promise<void> {
        const assetService = new AssetService(this.project);

        const loadAssetTasks = Object.keys(this.project.assets)
            .map((assetId) => assetService.getAssetMetadata(this.project.assets[assetId]));

        const results = await Promise.all(loadAssetTasks);
        const exportObject: any = { ...this.project };
        exportObject.assets = _.keyBy(results, (assetMetadata) => assetMetadata.asset.id);

        const fileName = `${this.project.name.replace(" ", "-")}-export.json`;
        await this.storageProvider.writeText(fileName, JSON.stringify(exportObject, null, 4));
    }
}
