import axios from "axios";

export class RestService {

    public constructor(private baseUrl: string, private defaultHeaders?: any){ }

    protected async sendApiRequest(
        method: string,
        relativeUrl: string,
        options: any = {}
    ) {

        const allHeaders = {
            ...this.defaultHeaders,
            ...options.headers
        };

        const requestOptions = {
            ...options,
            method,
            headers: allHeaders
        };

        return await axios(`${this.baseUrl}${relativeUrl}`, requestOptions);
    }

    protected async getApiResponse(
        method: string,
        relativeUrl: string,
        options: any = {}
    ) {
        const { data } = await this.sendApiRequest(method, relativeUrl, options);
        return (typeof data === "string") ? JSON.parse(data) : data;
    }
}
