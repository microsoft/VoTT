import { IApplicationState } from "../../models/applicationState";
import { getHostProcess } from "../../common/platform";

const initialState: IApplicationState = {
    appSettings: {
        devToolsEnabled: false,
        connection: null,
    },
    appContext: {
        hostProcess: getHostProcess(),
    },
    connections: null, // sampleConnections,
    recentProjects: null, // sampeProjects,
    currentProject: null,
};

export default initialState;
