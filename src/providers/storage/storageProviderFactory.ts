import { IAssetProvider, IAssetProviderRegistrationOptions } from "./assetProviderFactory";
import Guard from "../../common/guard";
import { IConnection, StorageType } from "../../models/applicationState";
import getHostProcess, { HostProcessType } from "../../common/hostProcess";

/**
 * Interface for all VoTT Storage Providers
 * @member storageType - Type of Storage (local, cloud)
 * @member readText - Read text from path
 * @member readBinary - Read Buffer from path
 * @member deleteFile - Delete file from path
 * @member writeText - Write text to file at path
 * @member writeBinary - Write buffer to file at path
 * @member listFiles - List files in container within storage provider
 * @member listContainers - List containers in storage provider
 * @member createContainer - Create container within storage provider
 * @member deleteContainer - Delete a container from a storage provider
 */
export interface IStorageProvider extends IAssetProvider {

    storageType: StorageType;

    readText(filePath: string): Promise<string>;
    readBinary(filePath: string): Promise<Buffer>;
    deleteFile(filePath: string): Promise<void>;

    writeText(filePath: string, contents: string): Promise<void>;
    writeBinary(filePath: string, contents: Buffer): Promise<void>;

    listFiles(folderPath?: string, ext?: string): Promise<string[]>;
    listContainers(folderPath?: string): Promise<string[]>;

    createContainer(folderPath: string): Promise<void>;
    deleteContainer(folderPath: string): Promise<void>;
}

/**
 * Interface for registration options of Storage Providers
 * @member factory - Function to instantiate storage provider
 */
export interface IStorageProviderRegistrationOptions extends IAssetProviderRegistrationOptions {
    factory: (options?: any) => IStorageProvider;
}

/**
 * @name - Storage Provider Factory
 * @description - Creates instance of Storage Providers based on request provider type
 */
export class StorageProviderFactory {
    /**
     * @returns - Dictionary of registered Storage Providers
     */
    public static get providers() {
        return { ...StorageProviderFactory.providerRegistry };
    }

    /**
     * Register a Storage Provider based on options
     * @param options - Storage Provider options
     */
    public static register(options: IStorageProviderRegistrationOptions);
    /**
     * Register Storage Provider based on name and a factory
     * @param name - Name of Storage Provider
     * @param factory - Function that instantiates Storage Provider
     */
    public static register(name: string, factory: (options?: any) => IStorageProvider);
    /**
     * Register Storage Provider based on name and a factory
     * @param name - Name of Storage Provider
     * @param factory - Function that instantiates Storage Provider
     */
    public static register(nameOrOptions: any, factory?: (options?: any) => IStorageProvider) {
        Guard.null(nameOrOptions);

        let options: IStorageProviderRegistrationOptions = nameOrOptions as IStorageProviderRegistrationOptions;

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

        StorageProviderFactory.providerRegistry[options.name] = options;
    }

    /**
     * Create Storage Provider from provider type and options specified in connection
     * @param connection Connection for a Storage Provider
     */
    public static createFromConnection(connection: IConnection) {
        return this.create(connection.providerType, connection.providerOptions);
    }

    /**
     * Create Storage Provider from registered Storage Provider name and options
     * @param name - Name of Storage Provider
     * @param options - Options for Storage Provider
     */
    public static create(name: string, options?: any): IStorageProvider {
        Guard.empty(name);

        const registrationOptions = StorageProviderFactory.providerRegistry[name];
        if (!registrationOptions) {
            throw new Error(`No storage provider has been registered with name '${name}'`);
        }

        return registrationOptions.factory(options);
    }

    /**
     * Indicates whether or not a Storage Provider has been registered
     * @param providerType - Name of Storage Provider
     */
    public static isRegistered(providerType: string): boolean {
        return this.providers[providerType] !== undefined;
    }

    private static providerRegistry: { [id: string]: IStorageProviderRegistrationOptions } = {};
}
