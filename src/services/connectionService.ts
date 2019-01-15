import shortid from "shortid";
import Guard from "../common/guard";
import { IConnection } from "../models/applicationState";
import { AssetProviderFactory } from "../providers/storage/assetProviderFactory";

/**
 * Functions required for a connection service
 * @member save - Save a connection
 */
export interface IConnectionService {
    save(connection: IConnection): Promise<IConnection>;
}

/**
 * @name - Connection Service
 * @description - Functions for dealing with project connections
 */
export default class ConnectionService implements IConnectionService {

    /**
     * Save a connection
     * @param connection - Connection to save
     */
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
