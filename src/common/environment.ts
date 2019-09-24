export class Env {
    public static get() {
        return process.env.NODE_ENV;
    }
    public static getApiUrl() {
        return process.env.REACT_APP_API_URL;
    }
}
