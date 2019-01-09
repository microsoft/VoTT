import shortid from "shortid";
import Guard from "../common/guard";
import { IConnection } from "../models/applicationState";
import { AssetProviderFactory } from "../providers/storage/assetProviderFactory";

export interface IConnectionService {
    save(connection: IConnection): Promise<IConnection>;
}

export default class ConnectionService implements IConnectionService {
    public save(connection: IConnection) {
        Guard.null(connection);

        return new Promise<IConnection>(async (resolve, reject) => {
            try {
                if (!connection.id) {
                    connection.id = shortid.generate();
                }

                const assetProvider = AssetProviderFactory.createFromConnection(connection);
                if (assetProvider.initialize) {
                    await assetProvider.initialize();
                }

                resolve(connection);
            } catch (err) {
                reject(err);
            }
        });
    }
}
