// tslint:disable-next-line:no-var-requires
const packageJson = require("../../package.json");

/**
 * Defines the application information
 */
export interface IAppInfo {
    /** The app name */
    name: string;
    /** The app version */
    version: string;
    /** The app description */
    description: string;
}

/**
 * Gets current application info
 */
export const appInfo = packageJson as IAppInfo;
