import { StorageProviders } from "./storageProviders"

/**
 * Valid asset providers
 * 
 * Note - uses a class with static readonly properties to
 * allow for class extension (TypeScript does not support
 * enum extension)
 */
export class AssetProviders extends StorageProviders {
    /** Bing image search asset provider */
    public static readonly BingImageSearch = "bingImageSearch";
}