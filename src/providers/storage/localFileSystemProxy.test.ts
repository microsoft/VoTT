import { StorageProviderFactory } from './storageProvider';
import { LocalFileSystemProxyOptions, LocalFileSystemProxy } from './localFileSystemProxy';
import { IpcRendererProxy } from '../../common/ipcRendererProxy';

describe('LocalFileSystemProxy Storage Provider', () => {
    it('Registers the provider with the StorageProviderFactory', () => {
        const storageProvider = StorageProviderFactory.create('localFileSystemProxy');
        expect(storageProvider).not.toBeNull();
    });
});