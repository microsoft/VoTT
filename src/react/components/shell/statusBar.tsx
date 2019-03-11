import React from "react";
import { appInfo } from "../../../common/appInfo";
import "./statusBar.scss";

export class StatusBar extends React.Component {
    public render() {
        return (
            <div className="status-bar">
                <div className="status-bar-main">{this.props.children}</div>
                <div className="status-bar-version">
                    <ul>
                        <li>
                            <i className="fas fa-code-branch"></i>
                            <span>{appInfo.version}</span>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
