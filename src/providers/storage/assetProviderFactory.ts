import { IAsset, IConnection } from "../../models/applicationState";
import Guard from "../../common/guard";
import getHostProcess, { HostProcessType } from "../../common/hostProcess";

/**
 * Interface for VoTT Asset Providers
 * @member initialize - Initializes or validates provider based on options
 * @member getAssets - Retrieves assets from provider
 */
export interface IAssetProvider {
    initialize?(): Promise<void>;
    getAssets(containerName?: string): Promise<IAsset[]>;
}

/**
 * Options for Asset Providers
 * @member name - Name of Asset Provider
 * @member displayName - Display Name of Asset Provider
 * @member description - Description of Asset Provider
 * @member platformSupport - Platform(s) supported by asset provider (electron, browser)
 * @member factory - Function that instantiates provider
 */
export interface IAssetProviderRegistrationOptions {
    name: string;
    displayName: string;
    description?: string;
    platformSupport?: HostProcessType;
    factory: (options?: any) => IAssetProvider;
}

/**
 * @name - Asset Provider Factory
 * @description - Creates instance of Asset Providers based on request provider type
 */
export class AssetProviderFactory {

    /**
     * @returns - Dictionary of registered Asset Providers
     */
    public static get providers() {
        return { ...AssetProviderFactory.providerRegistry };
    }

    /**
     * Register an Asset Provider based on options
     * @param options - Asset Provider options
     */
    public static register(options: IAssetProviderRegistrationOptions);
    /**
     * Register Asset provider based on name and a factory
     * @param name - Name of Asset Provider
     * @param factory - Function that instantiates Asset Provider
     */
    public static register(name: string, factory: (options?: any) => IAssetProvider);

    /**
     * Register Asset provider based on name and a factory
     * @param name - Name of Asset Provider
     * @param factory - Function that instantiates Asset Provider
     */
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

        if ((options.platformSupport & getHostProcess().type) === 0) {
            return;
        }

        AssetProviderFactory.providerRegistry[options.name] = options;
    }

    /**
     * Create Asset Provider from provider type and options specified in connection
     * @param connection - Connection for an Asset Provider
     */
    public static createFromConnection(connection: IConnection): IAssetProvider {
        return this.create(connection.providerType, connection.providerOptions);
    }

    /**
     * Create Asset Provider from registered Asset Provider name and options
     * @param name - Name of Asset Provider
     * @param options - Options for Asset Provider
     */
    public static create(name: string, options?: any): IAssetProvider {
        Guard.empty(name);

        const registrationOptions = AssetProviderFactory.providerRegistry[name];
        if (!registrationOptions) {
            throw new Error(`No asset provider has been registered with name '${name}'`);
        }

        return registrationOptions.factory(options);
    }

    private static providerRegistry: { [id: string]: IAssetProviderRegistrationOptions } = {};
}
