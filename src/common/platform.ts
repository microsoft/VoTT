import {
    IHostProcess,
    HostProcessType,
    IOS,
} from "../models/applicationState";
import os from "os";
import process from "process";
import { detect } from "detect-browser";

const browser = detect();

export function getHostProcess(): IHostProcess {
    return {
        name: getHostProcessType(),
        release: `${browser.name} ${browser.version}`,
    };
}

export function getOS(): IOS {
    return {
        name: os.platform(),
        release: os.release(),
        cpuArchitecture: os.arch(),
    };
}

function getHostProcessType(): HostProcessType {
    if (process.versions.hasOwnProperty("electron")) {
        return HostProcessType.Electron;
    } else {
        return HostProcessType.Browser;
    }
}
