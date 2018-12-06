import { ExportProvider } from "./exportProvider";
import { IProject } from "../../models/applicationState";

export interface IJsonExportOptions {
    foo: string;
}

export class JsonExportProvider extends ExportProvider<IJsonExportOptions> {
    constructor(project: IProject, options: IJsonExportOptions) {
        super(project, options);
    }

    public async export(): Promise<void> {
        const fileName = `${this.project.name.replace(" ", "-")}-export.json`;
        await this.storageProvider.writeText(fileName, JSON.stringify(this.project, null, 4));
    }
}
