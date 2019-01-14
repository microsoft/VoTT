/**
 * @name - Host Process
 * @description - Describes the host process
 * @member type - The type of the host process (electron, browser, etc)
 * @member release - The release string of the host process
 */
export interface IHostProcess {
    type: HostProcessType;
    release: string;
}

/**
 * @enum ELECTRON - Electron Host Process Type
 * @enum BROWSER - Browser Host Process Type
 */
export enum HostProcessType {
    Electron = 1, // bits: 01
    Browser = 2,  // bits: 10
    All = 3,      // bits: 11
}

import os from "os";
const osRelease = os.release().toLowerCase();

function getHostProcessType(): HostProcessType {
    if (osRelease.indexOf("electron") > -1 || process.env.TEST === "true") {
        return HostProcessType.Electron;
    } else {
        return HostProcessType.Browser;
    }
}

const hostProcess: IHostProcess = {
    type: getHostProcessType(),
    release: osRelease,
};

export default hostProcess;
