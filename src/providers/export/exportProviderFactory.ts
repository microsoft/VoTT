import Guard from "../../common/guard";
import { IExportProvider } from "./exportProvider";
import { IProject } from "../../models/applicationState";

export class ExportProviderFactory {
    public static get handlers() {
        return { ...ExportProviderFactory.handlerRegistry };
    }

    public static register(name: string, factory: (project, IProject, options?: any) => IExportProvider) {
        Guard.emtpy(name);
        Guard.null(factory);

        ExportProviderFactory.handlerRegistry[name] = factory;
    }

    public static create(name: string, project: IProject, options?: any): IExportProvider {
        Guard.emtpy(name);
        Guard.null(project);

        const handler = ExportProviderFactory.handlerRegistry[name];
        if (!handler) {
            throw new Error(`No export provider has been registered with name '${name}'`);
        }

        return handler(project, options);
    }

    private static handlerRegistry: { [id: string]: (project: IProject, options?: any) => IExportProvider } = {};
}
