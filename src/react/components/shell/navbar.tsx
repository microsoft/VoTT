import React from "react";
import { Link, NavLink } from "react-router-dom";
import { strings } from "../../../common/strings";

export default function Navbar() {
    return (
        <nav className="bg-lighter-2 app-navbar">
            <div className="app-navbar-logo">
                <ul>
                    <li><Link title="Home" to={`/`}><i className="fas fa-tags"></i></Link></li>
                </ul>
            </div>
            <div className="app-navbar-brand">
                <span>{strings.appName}</span>
            </div>
            <div className="app-navbar-menu">
                <ul>
                    <li>
                        <NavLink title="Profile Settings" to={`/profile`}>
                            <i className="fas fa-user-circle"></i>
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
