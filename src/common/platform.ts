import {
    IHostProcess,
    HostProcessType,
} from "../models/applicationState";
import os from "os";

export function getHostProcess(): IHostProcess {
    return {
        name: getHostProcessType(),
        release: os.release(),
    };
}

function getHostProcessType(): HostProcessType {
    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.indexOf(" electron/") > -1) {
        return HostProcessType.Electron;
    } else {
        return HostProcessType.Browser;
    }
}
