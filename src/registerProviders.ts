import { LocalFileSystemProxy } from './providers/storage/localFileSystemProxy';
import { StorageProviderFactory } from './providers/storage/storageProvider';

export default function registerProviders() {
    StorageProviderFactory.register('localFileSystemProxy', (options) => new LocalFileSystemProxy(options));
}