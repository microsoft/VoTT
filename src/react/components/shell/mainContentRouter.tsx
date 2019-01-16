import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import HomePage from "../pages/homepage/homePage";
import ActiveLearningPage from "../pages/activeLearningPage";
import AppSettingsPage from "../pages/appSettings/appSettingsPage";
import ConnectionPage from "../pages/connections/connectionsPage";
import EditorPage from "../pages/editorPage/editorPage";
import ExportPage from "../pages/export/exportPage";
import ProjectSettingsPage from "../pages/projectSettings/projectSettingsPage";
import ProfileSettingsPage from "../pages/profileSettingsPage";

/**
 * @name - Main Content Router
 * @description - Controls main content pane based on route
 */
export default function MainContentRouter() {
    return (
        <div className="app-content">
            <Switch>
                <Route path="/" exact component={HomePage} />
                <Route path="/settings" component={AppSettingsPage} />
                <Route path="/profile" component={ProfileSettingsPage} />
                <Route path="/connections/:connectionId" component={ConnectionPage} />
                <Route path="/connections" exact component={ConnectionPage} />
                <Route path="/projects/:projectId/edit" component={EditorPage} />
                <Route path="/projects/create" component={ProjectSettingsPage} />
                <Route path="/projects/:projectId/settings" component={ProjectSettingsPage} />
                <Route path="/projects/:projectId/export" component={ExportPage} />
                <Route path="/projects/:projectId/active-learning" component={ActiveLearningPage} />
                <Route component={HomePage} />
            </Switch>
        </div>
    );
}
