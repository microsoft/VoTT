import { IApplicationState } from "../../models/applicationState";

/**
 * Initial state of application
 * @member appSettings - Application settings
 * @member connections - Connections
 * @member recentProjects - Recent projects
 * @member currentProject - Current project
 * @member auth - Application auth
 */
const initialState: IApplicationState = {
    appSettings: {
        devToolsEnabled: false,
        securityTokens: [],
    },
    connections: [],
    recentProjects: [],
    currentProject: null,
    appError: null,
    auth: {
        accessToken: null,
    },
};

/**
 * Instance of initial application state
 */
export default initialState;
