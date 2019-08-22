import { RestService, RestMethods } from "./restService"
import { IConnection, IProject } from "../models/applicationState";

export class VoTTApiService extends RestService {

    public constructor() {
        super("https://vott.codewith.io/api/")
    }

    public async getSubscriptions(userId: string): Promise<string[]> {
        return await this.getApiResponse(RestMethods.GET, `subscriptions/${userId}`);
    }

    public async getAccounts(userId: string, subscriptionId: string): Promise<string[]> {
        return await this.getApiResponse(RestMethods.GET, `accounts/${userId}/${subscriptionId}`);
    }

    public async getContainers(userId: string, subscriptionId: string, accountName: string): Promise<string[]> {
        return await this.getApiResponse(RestMethods.GET, `containers/${userId}/${subscriptionId}/${accountName}`)
    }

    public async getProjects(
        userId: string,
        subscriptionId: string,
        accountName: string,
        containerName: string
    ): Promise<IProject[]> {
        return await this.getApiResponse(
            RestMethods.GET,
            `projects/${userId}/${subscriptionId}/${accountName}/${containerName}`
        );
    }


    public async getConnections(userId: string, subscriptionId: string, resourceGroup: string, accountName: string): Promise<IConnection[]> {
        return await this.getApiResponse(RestMethods.GET, `connections/${userId}/${subscriptionId}/${resourceGroup}/`);
    }

    public async getConnection(userId: string, connectionId: string): Promise<IConnection> {
        return await this.getApiResponse(RestMethods.GET, `connections/${userId}/${connectionId}`);
    }

    public async putConnection(userId: string, connection: IConnection) {
        await this.sendApiRequest(RestMethods.PUT, `connections/${userId}`, { data: connection })
    }

    public async deleteConnection(userId: string, connectionId: string) {
        await this.sendApiRequest(RestMethods.DELETE, `/connections/${userId}/${connectionId}`)
    }
}
