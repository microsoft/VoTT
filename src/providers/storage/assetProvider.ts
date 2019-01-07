import { IAsset, IConnection } from "../../models/applicationState";
import Guard from "../../common/guard";

export interface IAssetProvider {
    initialize?(): Promise<void>;
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

    public static createFromConnection(connection: IConnection): IAssetProvider {
        return this.create(connection.providerType, connection.providerOptions);
    }

    public static create(name: string, options?: any): IAssetProvider {
        Guard.emtpy(name);

        const handler = AssetProviderFactory.handlerRegistry[name];
        console.log(handler);

        return handler(options);
    }

    public static getAssets() {
        return this.getAssets();
    }
    private static handlerRegistry: { [id: string]: (options?: any) => IAssetProvider } = {};
}
