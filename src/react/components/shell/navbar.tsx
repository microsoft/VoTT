import React from "react";
import { Link, NavLink } from "react-router-dom";
import { strings } from "../../../common/strings";

/**
 * @name - Navbar
 * @description - Main navigation bar that remains visible throughout app experience
 */
export default function Navbar() {
    return (
        <nav className="bg-lighter-2 app-navbar">
            <div className="app-navbar-logo">
                <ul>
                    <li><Link title={strings.common.homePage} to={`/`}><i className="fas fa-tags"></i></Link></li>
                </ul>
            </div>
            <div className="app-navbar-brand">
                <span>{strings.appName}</span>
            </div>
            <div className="app-navbar-menu">
                <ul>
                    <li>
                        <NavLink title={strings.profile.settings} to={`/profile`}>
                            <i className="fas fa-user-circle"></i>
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
