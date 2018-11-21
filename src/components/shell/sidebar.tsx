import React from 'react';
import { NavLink } from 'react-router-dom';
import ConditionalNavLink from '../common/conditionalNavLink';

export default function Sidebar({ project }) {
    const projectId = project ? project.id : null;

    return (
        <div className="bg-lighter-2 app-sidebar">
            <ul>
                <li><ConditionalNavLink disabled={!projectId} title="Tag Editor" to={`/projects/${projectId}/edit`}><i className="fas fa-bookmark"></i></ConditionalNavLink></li>
                <li><ConditionalNavLink disabled={!projectId} title="Project Settings" to={`/projects/${projectId}/settings`}><i className="fas fa-sliders-h"></i></ConditionalNavLink></li>
                <li><ConditionalNavLink disabled={!projectId} title="Export" to={`/projects/${projectId}/export`}><i className="fas fa-external-link-square-alt"></i></ConditionalNavLink></li>
                <li><ConditionalNavLink disabled={!projectId} title="Active Learning" to={`/projects/${projectId}/active-learning`}><i className="fas fa-graduation-cap"></i></ConditionalNavLink></li>
                <li><NavLink title="Connections" to={`/connections`}><i className="fas fa-plug"></i></NavLink></li>
            </ul>
            <div className="app-sidebar-fill"></div>
            <ul>
                <li><NavLink title="Application Settings" to={`/settings`}><i className="fas fa-cog"></i></NavLink></li>
            </ul>
        </div>
    );
}