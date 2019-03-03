import React from "react";
import { appInfo } from "../../../common/appInfo";
import "./statusBar.scss";

export class StatusBar extends React.Component {
    public render() {
        return (
            <div className="status-bar">
                <div className="status-bar-main">{this.props.children}</div>
                <div className="status-bar-version">{appInfo.version}</div>
            </div>
        );
    }
}
