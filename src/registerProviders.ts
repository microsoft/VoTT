import { LocalFileSystemProxy } from "./providers/storage/localFileSystemProxy";
import { StorageProviderFactory } from "./providers/storage/storageProvider";
import { BingImageSearch } from "./providers/storage/bingImageSearch";
import { AssetProviderFactory } from "./providers/storage/assetProvider";
import { ExportProviderFactory } from "./providers/export/exportProviderFactory";
import { VottJsonExportProvider } from "./providers/export/vottJson";
import registerToolbar from "./registerToolbar";

export default function registerProviders() {
    // Storage Providers
    StorageProviderFactory.register("localFileSystemProxy", (options) => new LocalFileSystemProxy(options));

    // Asset Providers
    AssetProviderFactory.register("localFileSystemProxy", (options) => new LocalFileSystemProxy(options));
    AssetProviderFactory.register("bingImageSearch", (options) => new BingImageSearch(options));

    // Export Providers
    ExportProviderFactory.register("vottJson", (project, options) => new VottJsonExportProvider(project, options));

    registerToolbar();
}
