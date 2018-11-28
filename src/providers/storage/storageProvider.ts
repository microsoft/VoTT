export class StorageProvider {

}

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