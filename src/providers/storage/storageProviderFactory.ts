import { IAssetProvider, IAssetProviderRegistrationOptions } from "./assetProviderFactory";
import Guard from "../../common/guard";
import { IConnection, StorageType } from "../../models/applicationState";
import getHostProcess, { HostProcessType } from "../../common/hostProcess";

const hostProcess = getHostProcess();

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

export interface IStorageProviderRegistrationOptions extends IAssetProviderRegistrationOptions {
    factory: (options?: any) => IStorageProvider;
}

export class StorageProviderFactory {
    public static get providers() {
        return { ...StorageProviderFactory.providerRegistry };
    }

    public static register(options: IStorageProviderRegistrationOptions);
    public static register(name: string, factory: (options?: any) => IStorageProvider);

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

        if ((options.platformSupport & HostProcess.type) === 0) {
            return;
        }

        StorageProviderFactory.providerRegistry[options.name] = options;
    }

    public static createFromConnection(connection: IConnection) {
        return this.create(connection.providerType, connection.providerOptions);
    }

    public static create(name: string, options?: any): IStorageProvider {
        Guard.emtpy(name);

        const registrationOptions = StorageProviderFactory.providerRegistry[name];
        if (!registrationOptions) {
            throw new Error(`No storage provider has been registered with name '${name}'`);
        }

        return registrationOptions.factory(options);
    }

    public static isRegistered(providerType: string): boolean {
        return this.providers[providerType] !== undefined;
    }

    private static providerRegistry: { [id: string]: IStorageProviderRegistrationOptions } = {};
}
