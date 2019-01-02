import { ExportProviderFactory } from "./providers/export/exportProviderFactory";
import { TFPascalVOCJsonExportProvider } from "./providers/export/tensorFlowPascalVOC";
import { VottJsonExportProvider } from "./providers/export/vottJson";
import { AssetProviderFactory } from "./providers/storage/assetProvider";
import { AzureBlobStorage } from "./providers/storage/azureBlobStorage";
import { BingImageSearch } from "./providers/storage/bingImageSearch";
import { LocalFileSystemProxy } from "./providers/storage/localFileSystemProxy";
import { StorageProviderFactory } from "./providers/storage/storageProvider";
import registerToolbar from "./registerToolbar";

export default function registerProviders() {
    // Storage Providers
    StorageProviderFactory.register("localFileSystemProxy", (options) => new LocalFileSystemProxy(options));
    StorageProviderFactory.register("azureBlobStorage", (options) => new AzureBlobStorage(options));

    // Asset Providers
    AssetProviderFactory.register("localFileSystemProxy", (options) => new LocalFileSystemProxy(options));
    AssetProviderFactory.register("azureBlobStorage", (options) => new AzureBlobStorage(options));
    AssetProviderFactory.register("bingImageSearch", (options) => new BingImageSearch(options));

    // Export Providers
    ExportProviderFactory.register("vottJson", (project, options) => new VottJsonExportProvider(project, options));
    ExportProviderFactory.register("tensorFlowPascalVOC",
        (project, options) => new TFPascalVOCJsonExportProvider(project, options));

    registerToolbar();
}
