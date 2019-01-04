import { IAssetProvider } from "./assetProvider";
import Guard from "../../common/guard";
import { IConnection, StorageType } from "../../models/applicationState";

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

export class StorageProviderFactory {
    public static get handlers() {
        return { ...StorageProviderFactory.handlerRegistry };
    }

    public static register(name: string, factory: (options?: any) => IStorageProvider) {
        Guard.emtpy(name);
        Guard.null(factory);

        StorageProviderFactory.handlerRegistry[name] = factory;
    }

    public static createFromConnection(connection: IConnection) {
        return this.create(connection.providerType, connection.providerOptions);
    }

    public static create(name: string, options?: any): IStorageProvider {
        Guard.emtpy(name);

        const handler = StorageProviderFactory.handlerRegistry[name];
        if (!handler) {
            throw new Error(`No storage provider has been registered with name '${name}'`);
        }

        return handler(options);
    }

    private static handlerRegistry: { [id: string]: (options?: any) => IStorageProvider } = {};
}
