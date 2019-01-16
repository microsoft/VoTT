import { IApplicationState } from "../../models/applicationState";

const initialState: IApplicationState = {
    appSettings: {
        devToolsEnabled: false,
        connection: null,
    },
    connections: null, // sampleConnections,
    recentProjects: null, // sampleProjects,
    currentProject: null,
    appError: null,
};

export default initialState;
