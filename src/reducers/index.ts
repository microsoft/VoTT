import { combineReducers } from 'redux'
import * as appSettings from './applicationReducer';
import * as connections from './connectionsReducer';
import * as recentProjects from './recentProjectsReducer';
import * as currentProject from './currentProjectReducer'

export default combineReducers({
    appSettings: appSettings.reducer,
    connections: connections.reducer,
    recentProjects: recentProjects.reducer,
    currentProject: currentProject.reducer
});