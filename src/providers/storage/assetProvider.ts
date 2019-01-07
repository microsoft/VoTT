import { IAsset } from "../../models/applicationState";
import Guard from "../../common/guard";

export interface IAssetProvider {
    getAssets(containerName?: string): Promise<IAsset[]>;
}

export interface IAssetProviderRegistrationOptions {
    name: string;
    displayName: string;
    description?: string;
    factory: (options?: any) => IAssetProvider;
}

export class AssetProviderFactory {
    public static get providers() {
        return { ...AssetProviderFactory.providerRegistry };
    }

    public static register(options: IAssetProviderRegistrationOptions);
    public static register(name: string, factory: (options?: any) => IAssetProvider);

    public static register(nameOrOptions: any, factory?: (options?: any) => IAssetProvider) {
        Guard.null(nameOrOptions);

        let options: IAssetProviderRegistrationOptions = nameOrOptions as IAssetProviderRegistrationOptions;

        if (typeof (nameOrOptions) === "string") {
            Guard.null(factory);

            options = {
                name: nameOrOptions,
                displayName: nameOrOptions,
                factory,
            };
        }

        AssetProviderFactory.providerRegistry[options.name] = options;
    }

    public static create(name: string, options?: any): IAssetProvider {
        Guard.emtpy(name);

        const registrationOptions = AssetProviderFactory.providerRegistry[name];
        if (!registrationOptions) {
            throw new Error(`No asset provider has been registered with name '${name}'`);
        }

        return registrationOptions.factory(options);
    }

    public static getAssets() {
        return this.getAssets();
    }
    private static providerRegistry: { [id: string]: IAssetProviderRegistrationOptions } = {};
}
