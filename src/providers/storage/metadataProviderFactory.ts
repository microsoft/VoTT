import { IMetadata, IConnection } from "../../models/applicationState";
import Guard from "../../common/guard";
import getHostProcess, { HostProcessType } from "../../common/hostProcess";

/**
 * Interface for VoTT Metadata Providers
 * @member initialize - Initializes or validates provider based on options
 * @member getMetadatas - Retrieves Metadatas from provider
 */
export interface IMetadataProvider {
    initialize?(): Promise<void>;
    getMetadatas(containerName?: string): Promise<IMetadata[]>;
    addDefaultPropsToNewConnection?(connection: IConnection): IConnection;
}

/**
 * Options for Metadata Providers
 * @member name - Name of Metadata Provider
 * @member displayName - Display Name of Metadata Provider
 * @member description - Description of Metadata Provider
 * @member platformSupport - Platform(s) supported by Metadata provider (electron, browser)
 * @member factory - Function that instantiates provider
 */
export interface IMetadataProviderRegistrationOptions {
    name: string;
    displayName: string;
    description?: string;
    platformSupport?: HostProcessType;
    factory: (options?: any) => IMetadataProvider;
}

/**
 * @name - Metadata Provider Factory
 * @description - Creates instance of Metadata Providers based on request provider type
 */
export class MetadataProviderFactory {

    /**
     * @returns - Dictionary of registered Metadata Providers
     */
    public static get providers() {
        return { ...MetadataProviderFactory.providerRegistry };
    }

    /**
     * Register an Metadata Provider based on options
     * @param options - Metadata Provider options
     */
    public static register(options: IMetadataProviderRegistrationOptions);
    /**
     * Register Metadata provider based on name and a factory
     * @param name - Name of Metadata Provider
     * @param factory - Function that instantiates Metadata Provider
     */
    public static register(name: string, factory: (options?: any) => IMetadataProvider);

    /**
     * Register Metadata provider based on name and a factory
     * @param name - Name of Metadata Provider
     * @param factory - Function that instantiates Metadata Provider
     */
    public static register(nameOrOptions: any, factory?: (options?: any) => IMetadataProvider) {
        Guard.null(nameOrOptions);

        let options: IMetadataProviderRegistrationOptions = nameOrOptions as IMetadataProviderRegistrationOptions;

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

        MetadataProviderFactory.providerRegistry[options.name] = options;
    }

    /**
     * Create Metadata Provider from provider type and options specified in connection
     * @param connection - Connection for an Metadata Provider
     */
    public static createFromConnection(connection: IConnection): IMetadataProvider {
        return this.create(connection.providerType, connection.providerOptions);
    }

    /**
     * Create Metadata Provider from registered Metadata Provider name and options
     * @param name - Name of Metadata Provider
     * @param options - Options for Metadata Provider
     */
    public static create(name: string, options?: any): IMetadataProvider {
        Guard.empty(name);

        const registrationOptions = MetadataProviderFactory.providerRegistry[name];
        if (!registrationOptions) {
            throw new Error(`No Metadata provider has been registered with name '${name}'`);
        }

        return registrationOptions.factory(options);
    }

    private static providerRegistry: { [id: string]: IMetadataProviderRegistrationOptions } = {};
}
