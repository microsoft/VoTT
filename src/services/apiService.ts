import { RestService, RestMethods } from "./restService"
import { IConnection, IProject } from "../models/applicationState";
import { constants } from "../common/constants";

export class VoTTApiService extends RestService {

    public constructor() {
        const defaultHeaders = {}
        super(constants.vottApiBaseUrl, defaultHeaders)
    }

    public async getConnections(userId: string): Promise<IConnection[]> {
        return await this.getApiResponse(RestMethods.GET, `connections`);
    }

    public async getConnection(userId: string, connectionId: string): Promise<IConnection> {
        return await this.getApiResponse(RestMethods.GET, `connections/${userId}/${connectionId}`);
    }

    public async postConnection(userId: string, connection: IConnection) {
        await this.sendApiRequest(RestMethods.PUT, `connections/${userId}`, { data: connection })
    }

    public async putConnection(userId: string, connection: IConnection) {
        await this.sendApiRequest(RestMethods.PUT, `connections/${userId}`, { data: connection })
    }

    public async deleteConnection(userId: string, connectionId: string) {
        await this.sendApiRequest(RestMethods.DELETE, `/connections/${userId}/${connectionId}`)
    }
}
