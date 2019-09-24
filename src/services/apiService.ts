import axios, { AxiosInstance } from "axios";
import qs from "qs";
import { Env } from "../common/environment";

export interface ILoginRequestPayload {
    username: string;
    password: string;
}

class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: Env.getApiUrl(),
            timeout: 10 * 1000,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem("token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error),
        );
    }

    public updateToken = (token: string) => {
        localStorage.setItem("token", token);
        this.client.interceptors.request.use(
            async (config) => {
                config.headers.Authorization = `Bearer ${token}`;
                return config;
            },
            (error) => Promise.reject(error),
        );
    }

    public getToken = (): string | null => localStorage.getItem("token");

    public removeToken = (): void => localStorage.removeItem("token");

    public loginWithCredentials = (data: ILoginRequestPayload) => {
        const url = "api/v1/login/access-token";
        return this.client.post(url, qs.stringify(data));
    }
}

const apiService = new ApiService();

export default apiService;
