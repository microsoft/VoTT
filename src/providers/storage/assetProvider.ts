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
        const handler = AssetProviderFactory.handlerRegistry[name];
        if (!handler) {
            throw new Error(`No asset provider has been registered with name '${name}'`);
        }

        return handler(options);
    }
    private static handlerRegistry: { [id: string]: (options?: any) => IAssetProvider } = {};
}
