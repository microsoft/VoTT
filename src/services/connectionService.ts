import shortid from "shortid";
import { StorageProviderFactory } from "../providers/storage/storageProvider";
import { IConnection, IProject } from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { AssetProviderFactory } from "../providers/storage/assetProvider";

export interface IConnectionService {
    save(connection: IConnection): Promise<IConnection>;
}

export default class ConnectionService implements IConnectionService {
    public save(connection: IConnection) {
        Guard.null(connection);

        return new Promise<IConnection>(async (resolve,reject) => {
            try {
                if(!connection.id) {
                    connection.id = shortid.generate();
                }
                
                const assetProvider = AssetProviderFactory.createFromConnection(connection);
                if(assetProvider.initialize) {
                    await assetProvider.initialize();
                }

                resolve(connection);
            } catch (err) {
                reject(err);
            }
        });
    }
}