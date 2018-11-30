import { LocalFileSystemProxy } from './providers/storage/localFileSystemProxy';
import { AzureCloudStorageService } from './providers/storage/azureBlobStorage';
import { StorageProviderFactory } from './providers/storage/storageProvider';

export default function registerProviders() {
    StorageProviderFactory.register('localFileSystemProxy', (options) => new LocalFileSystemProxy(options));
    StorageProviderFactory.register('azureBlobStorage', (options) => new AzureCloudStorageService(options));
}
