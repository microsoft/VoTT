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
import SignedOutRoute from "./signedOutRoute";

/**
 * @name - Main Content Router
 * @description - Controls main content pane based on route
 */
export default function MainContentRouter({isAuth}) {
    return (
        <div className="app-content text-light">
            <Switch>
                <SignedOutRoute path="/" exact component={HomePage} />
                <SignedOutRoute path="/settings" component={AppSettingsPage} />
                <SignedOutRoute path="/connections/:connectionId" component={ConnectionPage} />
                <SignedOutRoute path="/connections" exact component={ConnectionPage} />
                <SignedOutRoute path="/projects/:projectId/edit" component={EditorPage} />
                <SignedOutRoute path="/projects/create" component={ProjectSettingsPage} />
                <SignedOutRoute path="/projects/:projectId/settings" component={ProjectSettingsPage} />
                <SignedOutRoute path="/projects/:projectId/export" component={ExportPage} />
                <SignedOutRoute path="/projects/:projectId/active-learning" component={ActiveLearningPage} />
                <SignedInRoute path="/sign-in" exact component={SignInPage} />
                <SignedOutRoute component={HomePage} />
            </Switch>
        </div>
    );
}
