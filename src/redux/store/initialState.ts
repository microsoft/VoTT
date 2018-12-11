import { IApplicationState } from "../../models/applicationState";

const initialState: IApplicationState = {
    appSettings: {
        devToolsEnabled: false,
        connection: null,
    },
    connections: null, // sampleConnections,
    recentProjects: null, // sampeProjects,
    currentProject: null,
};

export default initialState;
