import { ExportProviderFactory } from "./providers/export/exportProviderFactory";
import { TFPascalVOCExportProvider } from "./providers/export/tensorFlowPascalVOC";
import { TFRecordsExportProvider } from "./providers/export/tensorFlowRecords";
import { VottJsonExportProvider } from "./providers/export/vottJson";
import { AssetProviderFactory } from "./providers/storage/assetProviderFactory";
import { AzureBlobStorage } from "./providers/storage/azureBlobStorage";
import { BingImageSearch } from "./providers/storage/bingImageSearch";
import { LocalFileSystemProxy } from "./providers/storage/localFileSystemProxy";
import { StorageProviderFactory } from "./providers/storage/storageProviderFactory";
import registerToolbar from "./registerToolbar";
import { strings } from "./common/strings";
import { HostProcessType } from "./common/hostProcess";
import { AzureCustomVisionProvider } from "./providers/export/azureCustomVision";

/**
 * Registers storage, asset and export providers, as well as all toolbar items
 */
export default function registerProviders() {
    // Storage Providers
    StorageProviderFactory.register({
        name: "localFileSystemProxy",
        displayName: strings.connections.providers.local.title,
        platformSupport: HostProcessType.Electron,
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
        platformSupport: HostProcessType.Electron,
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
    ExportProviderFactory.register({
        name: "vottJson",
        displayName: strings.export.providers.vottJson.displayName,
        factory: (project, options) => new VottJsonExportProvider(project, options),
    });
    ExportProviderFactory.register({
        name: "tensorFlowPascalVOC",
        displayName: strings.export.providers.tfPascalVoc.displayName,
        factory: (project, options) => new TFPascalVOCExportProvider(project, options),
    });
    ExportProviderFactory.register({
        name: "tensorFlowRecords",
        displayName: strings.export.providers.tfRecords.displayName,
        factory: (project, options) => new TFRecordsExportProvider(project, options),
    });
    ExportProviderFactory.register({
        name: "azureCustomVision",
        displayName: strings.export.providers.azureCV.displayName,
        factory: (project, options) => new AzureCustomVisionProvider(project, options),
    });

    registerToolbar();
}
