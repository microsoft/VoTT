import {
    IHostProcess,
    HostProcessType,
    IHostProcessInfo,
    IOS,
    CPUArchitectureType,
    OSType,
    IOSInfo
} from "../models/applicationState";

export function getHostProcess(): IHostProcess {
    const procType = getProcessType();
    const procInfo = getProcessInfo(procType);

    return {
        type: procType,
        info: procInfo,
    };
}

export function getOS(): IOS {
    const osType = getOsType();
    const osInfo = getOSInfo(osType);

    return {
        type: osType,
        info: osInfo,
    }
}

function getProcessType(): HostProcessType {
    // TODO
    return HostProcessType.Browser;
}

function getProcessInfo(type: HostProcessType): IHostProcessInfo {
    switch (type) {
        case HostProcessType.Browser:
            return {
                build: "TODO",
                cpuArchitecture: CPUArchitectureType.x64, // TODO
            };
        case HostProcessType.Electron:
            return {
                build: "TODO",
                cpuArchitecture: CPUArchitectureType.x86, // TODO
            };
    }
}

function getOsType(): OSType {
    // TODO
    return OSType.Linux;
}

function getOSInfo(type: OSType): IOSInfo {
    switch (type) {
        case OSType.Linux:
            return {
                build: "TODO",
                cpuArchitecture: CPUArchitectureType.x64, // TODO
            };
        case OSType.Mac:
            return {
                build: "TODO",
                cpuArchitecture: CPUArchitectureType.x64, // TODO
            };
        case OSType.Windows:
            return {
                build: "TODO",
                cpuArchitecture: CPUArchitectureType.x64, // TODO
            };
    }
}
