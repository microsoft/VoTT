import { IApplicationState } from "../../models/applicationState";
import { getHostProcess, getOS } from "../../common/platform";

const initialState: IApplicationState = {
    appSettings: {
        devToolsEnabled: false,
        connection: null,
    },
    appContext: {
        hostProcess: getHostProcess(),
        os: getOS(),
    },
    connections: null, // sampleConnections,
    recentProjects: null, // sampeProjects,
    currentProject: null,
};

export default initialState;
