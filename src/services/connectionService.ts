import shortid from "shortid";
import { IConnection } from "../store/applicationState";

export interface IConnectionService {
    get(id: string): Promise<IConnection>;
    getList(): Promise<IConnection[]>;
    save(connection: IConnection): Promise<IConnection>;
    delete(connection: IConnection): Promise<void>;
}

export default class ConnectionService implements IConnectionService {
    public get(id: string): Promise<IConnection> {
        return new Promise<IConnection>(async (resolve, reject) => {
            const allConnections = await this.getList();
            const filtered = allConnections.filter((connection) => connection.id === id);
            if (filtered.length === 1) {
                resolve(filtered[0]);
            }

            reject({
                message: `No connection found with id: '${id}'`,
            });
        });
    }

    public getList(): Promise<IConnection[]> {
        return new Promise<IConnection[]>((resolve, reject) => {
            const connectionsJson = localStorage.getItem("connections");
            if (!connectionsJson) {
                return resolve([]);
            }

            let connections: IConnection[] = [];

            try {
                connections = JSON.parse(connectionsJson);
            } catch (err) {
                console.warn("Error loading connections from local storage");
            }

            resolve(connections);
        });
    }

    public save(connection: IConnection) {
        return new Promise<IConnection>(async (resolve, reject) => {
            try {
                if (!connection.id) {
                    connection.id = shortid.generate();
                }

                let allConnections = await this.getList();
                allConnections = [{ ...connection }, ...allConnections.filter((prj) => prj.id !== connection.id)];
                localStorage.setItem("connections", JSON.stringify(allConnections));
                resolve(connection);
            } catch (err) {
                resolve(err);
            }
        });
    }

    public delete(connection: IConnection) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let allConnections = await this.getList();
                allConnections = allConnections.filter((prj) => prj.id !== connection.id);
                localStorage.setItem("connections", JSON.stringify(allConnections));
                resolve();
            } catch (err) {
                resolve(err);
            }
        });
    }
}
