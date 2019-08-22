import axios from "axios";

export enum RestMethods {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}

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

        const url = `${this.baseUrl}${relativeUrl}`;

        console.log(`Making ${method} request to ${url}`)

        return await axios(url, requestOptions);
    }

    protected async getApiResponse(
        method: string,
        relativeUrl: string,
        options: any = {}
    ) {
        const { data } = await this.sendApiRequest(method, relativeUrl, options);
        console.log(`Got response: ${JSON.stringify(data)}`)
        return (typeof data === "string") ? JSON.parse(data) : data;
    }
}
