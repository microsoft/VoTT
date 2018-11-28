export interface IStorageProvider {
    readText(filePath: string): Promise<string>;
    readBinary(filePath: string): Promise<Buffer>;
    deleteFile(filePath: string): Promise<void>;

    writeText(filePath: string, contents: string): Promise<void>;
    writeBinary(filePath: string, contents: Buffer): Promise<void>;

    listFiles(folderPath: string): Promise<string[]>;
    listContainers(folderPath: string): Promise<string[]>;

    createContainer(folderPath: string): Promise<void>;
    deleteContainer(folderPath: string): Promise<void>;
}

export class StorageProviderFactory {
    private static handlers: { [id: string]: (options?: any) => IStorageProvider } = {};

    static register(name: string, factory: (options?: any) => IStorageProvider) {
        StorageProviderFactory.handlers[name] = factory;
    }

    static create(name: string, options?: any): IStorageProvider {
        const handler = StorageProviderFactory.handlers[name];
        if (!handler) {
            throw new Error(`No storage provider has been registered with name '${name}'`);
        }

        return handler(options);
    }
}