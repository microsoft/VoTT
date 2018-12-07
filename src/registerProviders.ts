import { LocalFileSystemProxy } from "./providers/storage/localFileSystemProxy";
import { AzureCloudStorageService } from "./providers/storage/azureBlobStorage";
import { StorageProviderFactory } from "./providers/storage/storageProvider";
import { BingImageSearch } from "./providers/storage/bingImageSearch";
import { AssetProviderFactory } from "./providers/storage/assetProvider";
import { ExportProviderFactory } from "./providers/export/exportProviderFactory";
import { JsonExportProvider } from "./providers/export/jsonExportProvider";

export default function registerProviders() {
    // Storage Providers
    StorageProviderFactory.register("localFileSystemProxy", (options) => new LocalFileSystemProxy(options));
    StorageProviderFactory.register("azureBlobStorage", (options) => new AzureCloudStorageService(options));

    // Asset Providers
    AssetProviderFactory.register("azureBlobStorage", (options) => new AzureCloudStorageService(options));
    AssetProviderFactory.register("localFileSystemProxy", (options) => new LocalFileSystemProxy(options));
    AssetProviderFactory.register("bingImageSearch", (options) => new BingImageSearch(options));

    // Export Providers
    ExportProviderFactory.register("json", (project, options) => new JsonExportProvider(project, options));
}
