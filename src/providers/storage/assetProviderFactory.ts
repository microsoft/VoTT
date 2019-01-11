import { IAsset, IConnection } from "../../models/applicationState";
import Guard from "../../common/guard";
import HostProcess, { HostProcessType } from "../../common/hostProcess";

export interface IAssetProvider {
    initialize?(): Promise<void>;
    getAssets(containerName?: string): Promise<IAsset[]>;
}

export interface IAssetProviderRegistrationOptions {
    name: string;
    displayName: string;
    description?: string;
    platformSupport?: HostProcessType;
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

        if (!options.platformSupport) {
            options.platformSupport = HostProcessType.All;
        }

        if ((options.platformSupport & HostProcess.type) === 0) {
            return;
        }

        AssetProviderFactory.providerRegistry[options.name] = options;
    }

    public static createFromConnection(connection: IConnection): IAssetProvider {
        return this.create(connection.providerType, connection.providerOptions);
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
