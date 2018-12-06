import Guard from "../../common/guard";
import { IExportProvider } from "./exportProvider";

export class ExportProviderFactory {
    public static get handlers() {
        return { ...ExportProviderFactory.handlerRegistry };
    }

    public static register(name: string, factory: (options?: any) => IExportProvider) {
        Guard.emtpy(name);
        Guard.null(factory);

        ExportProviderFactory.handlerRegistry[name] = factory;
    }

    public static create(name: string, options?: any): IExportProvider {
        Guard.emtpy(name);

        const handler = ExportProviderFactory.handlerRegistry[name];
        if (!handler) {
            throw new Error(`No storage provider has been registered with name '${name}'`);
        }

        return handler(options);
    }

    private static handlerRegistry: { [id: string]: (options?: any) => IExportProvider } = {};
}
