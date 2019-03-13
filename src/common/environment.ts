export class Env {
    public static get() {
        return process.env.NODE_ENV;
    }

    public static isDevelopment(): boolean {
        return this.get() !== "production";
    }
}
