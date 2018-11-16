import React from 'react';
import { Route } from 'react-router-dom';
import HomePage from '../pages/homePage';
import ActiveLearningPage from '../pages/activeLearningPage';
import AppSettingsPage from '../pages/appSettingsPage';
import ConnectionPage from '../pages/connectionsPage';
import EditorPage from '../pages/editorPage';
import ExportPage from '../pages/exportPage';
import ProjectSettingsPage from '../pages/projectSettingsPage';
import ProfileSettingsPage from '../pages/profileSettingsPage';

export default function MainContentRouter() {
    return (
        <div className="app-content">
            <Route path="/" exact component={HomePage} />
            <Route path="/settings" component={AppSettingsPage} />
            <Route path="/profile" component={ProfileSettingsPage} />
            <Route path="/connections" component={ConnectionPage} />
            <Route path="/project/settings" component={ProjectSettingsPage} />
            <Route path="/project/edit" component={EditorPage} />
            <Route path="/project/export" component={ExportPage} />
            <Route path="/project/active-learning" component={ActiveLearningPage} />
        </div>
    );
}