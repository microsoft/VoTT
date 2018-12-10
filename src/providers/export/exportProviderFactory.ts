import Guard from "../../common/guard";
import { IExportProvider } from "./exportProvider";
import { IProject } from "../../models/applicationState";

/**
 * @name - Export Provider Factory
 * @description - Creates instance of export providers based on request providery type
 */
export class ExportProviderFactory {
    public static get handlers() {
        return { ...ExportProviderFactory.handlerRegistry };
    }

    /**
     * Registers a factory method for the specified export provider type
     * @param name - The name of the export provider
     * @param factory - The factory method to construct new instances
     */
    public static register(name: string, factory: (project, IProject, options?: any) => IExportProvider) {
        Guard.emtpy(name);
        Guard.null(factory);

        ExportProviderFactory.handlerRegistry[name] = factory;
    }

    /**
     * Creates new instances of the specifed export provider
     * @param name - The name of the export provider to instantiate
     * @param project - The project to load into the export provider
     * @param options  - The provider specific options for exporting
     */
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
