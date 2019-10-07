import axios, { AxiosInstance, AxiosPromise } from "axios";
import qs from "qs";
import { Env } from "../common/environment";

export interface ILoginRequestPayload {
    username: string;
    password: string;
}

export interface IApiService {
    loginWithCredentials(data: ILoginRequestPayload): AxiosPromise<IUserCredentials>;
    testToken(): AxiosPromise<IUser>;
    getCurrentUser(): AxiosPromise<IUser>;
}

interface IUserCredentials {
    access_token: string;
    token_type: string;
}

interface IUser {
    email: string;
    full_name: string;
    is_active: boolean;
    is_superuser: boolean;
    city_id: number;
    id: number;
    created_at: string;
    updated_at: string;
  }

export class ApiService implements IApiService {
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

    public loginWithCredentials = (data: ILoginRequestPayload): AxiosPromise<IUserCredentials> => {
        const url = "api/v1/login/access-token";
        return this.client.post(url, qs.stringify(data));
    }

    public testToken = (): AxiosPromise<IUser> => {
        const url = "api/v1/login/test-token";
        return this.client.post(url);
    }

    public getCurrentUser = (): AxiosPromise<IUser> => {
        const url = "api/v1/users/me";
        return this.client.get(url);
    }
}

const apiService = new ApiService();

export default apiService;
