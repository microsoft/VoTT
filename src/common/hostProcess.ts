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
    Electron = 1 << 0,
    Browser = 1 << 1,
    All = ~(~0 << 2),
}

export function typeToFriendlyName(type: HostProcessType): string {
    switch (type) {
        case HostProcessType.Electron:
            return "electron";
        case HostProcessType.Browser:
            return "browser";
    }
}

const osRelease = require("os").release();

function getHostProcessType(): HostProcessType {
    if (osRelease.indexOf("electron") > -1) {
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
