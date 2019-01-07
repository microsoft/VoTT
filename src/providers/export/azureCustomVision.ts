import { ExportProvider, ExportAssetState } from "./exportProvider";
import Guard from "../../common/guard";
import { IProject } from "../../models/applicationState";

export interface IAzureCustomVisionOptions {
    assetState: ExportAssetState;
}

export default class AzureCustomVisionProvider extends ExportProvider<IAzureCustomVisionOptions> {
    constructor(project: IProject, options: IAzureCustomVisionOptions) {
        super(project, options);
        Guard.null(options);
    }

    public export(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
