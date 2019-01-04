import { StorageType } from "./applicationState";

/**
 * Gets the StorageType enum that accompanies the storage provider type
 * @param providerType Storage provider type
 */
export function getStorageType(providerType: string) {
    switch (providerType) {
        case "localFileSystemProxy":
            return StorageType.local;
        case "azureBlobStorage":
            return StorageType.cloud;
        default:
            return StorageType.other;
    }
}
