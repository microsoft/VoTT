import { ExportProviderFactory } from "./providers/export/exportProviderFactory";
import { TFPascalVOCJsonExportProvider } from "./providers/export/tensorFlowPascalVOC";
import { VottJsonExportProvider } from "./providers/export/vottJson";
import { AssetProviderFactory } from "./providers/storage/assetProviderFactory";
import { AzureBlobStorage } from "./providers/storage/azureBlobStorage";
import { BingImageSearch } from "./providers/storage/bingImageSearch";
import { LocalFileSystemProxy } from "./providers/storage/localFileSystemProxy";
import { StorageProviderFactory } from "./providers/storage/storageProviderFactory";
import registerToolbar from "./registerToolbar";
import { strings } from "./common/strings";
import { AzureCustomVisionProvider } from "./providers/export/azureCustomVision";

export default function registerProviders() {
    // Storage Providers
    StorageProviderFactory.register({
        name: "localFileSystemProxy",
        displayName: strings.connections.providers.local.title,
        factory: (options) => new LocalFileSystemProxy(options),
    });
    StorageProviderFactory.register({
        name: "azureBlobStorage",
        displayName: strings.connections.providers.azureBlob.title,
        factory: (options) => new AzureBlobStorage(options),
    });

    // Asset Providers
    AssetProviderFactory.register({
        name: "localFileSystemProxy",
        displayName: strings.connections.providers.local.title,
        factory: (options) => new LocalFileSystemProxy(options),
    });
    AssetProviderFactory.register({
        name: "azureBlobStorage",
        displayName: strings.connections.providers.azureBlob.title,
        factory: (options) => new AzureBlobStorage(options),
    });
    AssetProviderFactory.register({
        name: "bingImageSearch",
        displayName: strings.connections.providers.bing.title,
        factory: (options) => new BingImageSearch(options),
    });

    // Export Providers
    ExportProviderFactory.register("vottJson", (project, options) => new VottJsonExportProvider(project, options));
    ExportProviderFactory.register("tensorFlowPascalVOC",
        (project, options) => new TFPascalVOCJsonExportProvider(project, options));

    ExportProviderFactory.register("azureCustomVision",
        (project, options) => new AzureCustomVisionProvider(project, options));

    registerToolbar();
}
