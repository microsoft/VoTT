import { IAsset } from "../../models/applicationState";
import Guard from "../../common/guard";

export interface IAssetProvider {
    getAssets(containerName?: string): Promise<IAsset[]>;
}

export class AssetProviderFactory {
    public static get handlers() {
        return { ...AssetProviderFactory.handlerRegistry };
    }

    public static register(name: string, factory: (options?: any) => IAssetProvider) {
        Guard.emtpy(name);
        Guard.null(factory);

        AssetProviderFactory.handlerRegistry[name] = factory;
    }

    public static create(name: string, options?: any): IAssetProvider {
        Guard.emtpy(name);

        const handler = AssetProviderFactory.handlerRegistry[name];
        console.log(handler);
        // if (!handler) {
        //     throw new Error(`No asset provider has been registered with name '${name}'`);
        // }

        return handler(options);
    }

    public static getAssets() {
        return this.getAssets();
    }
    private static handlerRegistry: { [id: string]: (options?: any) => IAssetProvider } = {};
}
