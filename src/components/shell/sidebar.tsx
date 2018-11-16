import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    return (
        <div className="bg-primary app-sidebar">
            <ul>
                <li><NavLink title="Tag Editor"  to={`/project/edit`}><i className="fas fa-bookmark"></i></NavLink></li>
                <li><NavLink title="Connections" to={`/connections`}><i className="fas fa-plug"></i></NavLink></li>
                <li><NavLink title="Export" to={`/project/export`}><i className="fas fa-external-link-square-alt"></i></NavLink></li>
                <li><NavLink title="Active Learning" to={`/project/active-learning`}><i className="fas fa-graduation-cap"></i></NavLink></li>
                <li><NavLink title="Project Settings" to={`/project/settings`}><i className="fas fa-sliders-h"></i></NavLink></li>
            </ul>
            <div className="app-sidebar-fill"></div>
            <ul>
                <li><NavLink title="Application Settings" to={`/settings`}><i className="fas fa-cog"></i></NavLink></li>
            </ul>
        </div>
    );
}