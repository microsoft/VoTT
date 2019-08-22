import { RestService } from "./restService"
import { IConnection } from "../models/applicationState";

export class CloudConnectionService extends RestService {

    public constructor() {
        super("https://vott.codewith.io")
    }

    public async getConnections(userId: string): Promise<IConnection[]> {
        return await this.getApiResponse("GET", `/api/connections/${userId}`);
    }

    public async getConnection(userId: string, connectionId: string): Promise<IConnection> {
        return await this.getApiResponse("GET", `/api/connections/${userId}/${connectionId}`);
    }

    public async putConnection(userId: string, connection: IConnection) {
        await this.sendApiRequest("PUT", `/api/connections/${userId}`, { data: connection })
    }

    public async deleteConnection(userId: string, connectionId: string) {
        await this.sendApiRequest("DELETE", `/api/connections/${userId}/${connectionId}`)
    }
}
