import React from "react";
import { Switch } from "react-router-dom";
import HomePage from "../pages/homepage/homePage";
import ActiveLearningPage from "../pages/activeLearning/activeLearningPage";
import AppSettingsPage from "../pages/appSettings/appSettingsPage";
import ConnectionPage from "../pages/connections/connectionsPage";
import EditorPage from "../pages/editorPage/editorPage";
import ExportPage from "../pages/export/exportPage";
import ProjectSettingsPage from "../pages/projectSettings/projectSettingsPage";
import SignInPage from "../pages/signIn/signInPage";
import SignedInRoute from "./signedInRoute";
import AnonymousRoute from "./anonymousRoute";

/**
 * @name - Main Content Router
 * @description - Controls main content pane based on route
 */
export default function MainContentRouter() {
    return (
        <div className="app-content text-light">
            <Switch>
                <AnonymousRoute path="/" exact component={HomePage} />
                <AnonymousRoute path="/settings" component={AppSettingsPage} />
                <AnonymousRoute path="/connections/:connectionId" component={ConnectionPage} />
                <AnonymousRoute path="/connections" exact component={ConnectionPage} />
                <AnonymousRoute path="/projects/:projectId/edit" component={EditorPage} />
                <AnonymousRoute path="/projects/create" component={ProjectSettingsPage} />
                <AnonymousRoute path="/projects/:projectId/settings" component={ProjectSettingsPage} />
                <AnonymousRoute path="/projects/:projectId/export" component={ExportPage} />
                <AnonymousRoute path="/projects/:projectId/active-learning" component={ActiveLearningPage} />
                <SignedInRoute path="/sign-in" exact component={SignInPage} />
                <AnonymousRoute component={HomePage} />
            </Switch>
        </div>
    );
}
