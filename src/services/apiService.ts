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
                const token = JSON.parse(localStorage.getItem("auth")).accessToken;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error),
        );

    }

    public loginWithCredentials = (data: ILoginRequestPayload) => {
        const url = "api/v1/login/access-token";
        return this.client.post(url, qs.stringify(data));
    }

    public testToken = () => {
        const url = "api/v1/login/test-token";
        return this.client.post(url);
    }

    public getCurrentUser = () => {
        const url = "api/v1/users/me";
        return this.client.get(url);
    }
}

const apiService = new ApiService();

export default apiService;
