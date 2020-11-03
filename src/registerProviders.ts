import { ExportProviderFactory } from "./providers/export/exportProviderFactory";
import { PascalVOCExportProvider } from "./providers/export/pascalVOC";
import { TFRecordsExportProvider } from "./providers/export/tensorFlowRecords";
import { VottJsonExportProvider } from "./providers/export/vottJson";
import { CsvExportProvider } from "./providers/export/csv";
import { AssetProviderFactory } from "./providers/storage/assetProviderFactory";
import { AzureBlobStorage } from "./providers/storage/azureBlobStorage";
import { BingImageSearch } from "./providers/storage/bingImageSearch";
import { LocalFileSystemProxy } from "./providers/storage/localFileSystemProxy";
import { StorageProviderFactory } from "./providers/storage/storageProviderFactory";
import registerToolbar from "./registerToolbar";
import { strings } from "./common/strings";
import { HostProcessType } from "./common/hostProcess";
import { AzureCustomVisionProvider } from "./providers/export/azureCustomVision";
import { CntkExportProvider } from "./providers/export/cntk";
import { StorageProviders } from "./providers/storage/storageProviders";
import { AssetProviders } from "./providers/storage/assetProviders";

/**
 * Registers storage, asset and export providers, as well as all toolbar items
 */
export default function registerProviders() {
    // Storage Providers
    StorageProviderFactory.register({
        name: StorageProviders.LocalFileSystemProxy,
        displayName: strings.connections.providers.local.title,
        platformSupport: HostProcessType.Electron,
        factory: (options) => new LocalFileSystemProxy(options),
    });
    StorageProviderFactory.register({
        name: StorageProviders.AzureBlobStorage,
        displayName: strings.connections.providers.azureBlob.title,
        factory: (options) => new AzureBlobStorage(options),
    });

    // Asset Providers
    AssetProviderFactory.register({
        name: AssetProviders.LocalFileSystemProxy,
        displayName: strings.connections.providers.local.title,
        platformSupport: HostProcessType.Electron,
        factory: (options) => new LocalFileSystemProxy(options),
    });
    AssetProviderFactory.register({
        name: AssetProviders.AzureBlobStorage,
        displayName: strings.connections.providers.azureBlob.title,
        factory: (options) => new AzureBlobStorage(options),
    });
    AssetProviderFactory.register({
        name: AssetProviders.BingImageSearch,
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
        name: "pascalVOC",
        displayName: strings.export.providers.pascalVoc.displayName,
        factory: (project, options) => new PascalVOCExportProvider(project, options),
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
    ExportProviderFactory.register({
        name: "cntk",
        displayName: strings.export.providers.cntk.displayName,
        factory: (project, options) => new CntkExportProvider(project, options),
    });
    ExportProviderFactory.register({
        name: "csv",
        displayName: strings.export.providers.csv.displayName,
        factory: (project, options) => new CsvExportProvider(project, options),
    });

    registerToolbar();
}
