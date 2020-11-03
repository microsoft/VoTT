/**
 * Valid storage providers
 *
 * Note - uses a class with static readonly properties to
 * allow for class extension (TypeScript does not support
 * enum extension)
 */
export class StorageProviders {
    /** Local file system proxy storage provider */
    public static readonly LocalFileSystemProxy = "localFileSystemProxy";
    /** Azure blob storage provider */
    public static readonly AzureBlobStorage = "azureBlobStorage";
}
