import React from "react";
import { Switch, Route } from "react-router-dom";
import HomePage from "../pages/homepage/homePage";
import ActiveLearningPage from "../pages/activeLearning/activeLearningPage";
import AppSettingsPage from "../pages/appSettings/appSettingsPage";
import ConnectionPage from "../pages/connections/connectionsPage";
import EditorSegmentPage from "../pages/editorPage/segment/editorSegmentPage";
import EditorGeometryPage from "../pages/editorPage/geometry/editorGeometryPage";
import ExportPage from "../pages/export/exportPage";
import ProjectSettingsPage from "../pages/projectSettings/projectSettingsPage";
import EditorMetadataPage from "../pages/editorPage/metadata/editorMetadataPage";

/**
 * @name - Main Content Router
 * @description - Controls main content pane based on route
 */
export default function MainContentRouter() {
    return (
        <div className="app-content text-light">
            <Switch>
                <Route path="/" exact component={HomePage} />
                <Route path="/settings" component={AppSettingsPage} />
                <Route path="/connections/:connectionId" component={ConnectionPage} />
                <Route path="/connections" exact component={ConnectionPage} />
                <Route path="/projects/:projectId/edit" component={EditorGeometryPage} />
                <Route path="/projects/:projectId/editSeg" component={EditorSegmentPage} />
                <Route path="/projects/:projectId/editMetadata" component={EditorMetadataPage} />
                <Route path="/projects/create" component={ProjectSettingsPage} />
                <Route path="/projects/:projectId/settings" component={ProjectSettingsPage} />
                <Route path="/projects/:projectId/export" component={ExportPage} />
                <Route path="/projects/:projectId/active-learning" component={ActiveLearningPage} />
                <Route component={HomePage} />
            </Switch>
        </div>
    );
}
