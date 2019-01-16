import { IApplicationState } from "../../models/applicationState";

/**
 * Initial state of application
 * @member appSettings - Application settings
 * @member connections - Connections
 * @member recentProjects - Recent projects
 * @member currentProject - Current project
 */
const initialState: IApplicationState = {
    appSettings: {
        devToolsEnabled: false,
        securityTokens: [
            { name: "Token1", key: "ABC123" },
            { name: "Token2", key: "XYZ456" },
        ],
    },
    connections: null, // sampleConnections,
    recentProjects: null, // sampleProjects,
    currentProject: null,
    appError: null,
};

/**
 * Instance of initial application state
 */
export default initialState;
