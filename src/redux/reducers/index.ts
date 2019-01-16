import { combineReducers } from "redux";
import * as appSettings from "./applicationReducer";
import * as connections from "./connectionsReducer";
import * as currentProject from "./currentProjectReducer";
import * as recentProjects from "./recentProjectsReducer";
import * as appError from "./appErrorReducer";

/**
 * All application reducers
 * @member appSettings - Application Settings reducer
 * @member connections - Connections reducer
 * @member recentProjects - Recent Projects reducer
 * @member currentProject - Current Project reducer
 */
export default combineReducers({
    appSettings: appSettings.reducer,
    connections: connections.reducer,
    recentProjects: recentProjects.reducer,
    currentProject: currentProject.reducer,
    appError: appError.reducer,
});
