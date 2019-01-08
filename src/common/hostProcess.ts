/**
 * @name - Host Process
 * @description - Describes the host process
 * @member name - The name of the host process (electron or browser)
 * @member release - The release string of the host process
 */
export interface IHostProcess {
    name: HostProcessType;
    release: string;
}

/**
 * @enum ELECTRON - Electron Host Process Type
 * @enum BROWSER - Browser Host Process Type
 */
export enum HostProcessType {
    Electron = "electron",
    Browser = "browser",
}

import os from "os";

const hostProcess: IHostProcess = {
    name: getHostProcessType(),
    release: os.release(),
};

function getHostProcessType(): HostProcessType {
    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.indexOf(" electron/") > -1) {
        return HostProcessType.Electron;
    } else {
        return HostProcessType.Browser;
    }
}

export default hostProcess;
