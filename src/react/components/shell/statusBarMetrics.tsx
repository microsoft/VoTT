import React from "react";
import _ from "lodash";
import { IProject, AssetState } from "../../../models/applicationState";

export interface IStatusBarMetricsProps {
    project: IProject;
}

export class StatusBarMetrics extends React.Component<IStatusBarMetricsProps> {
    public render() {
        const { project } = this.props;

        if (!project) {
            return null;
        }

        const projectAssets = _.values(project.assets);
        const visitedAssets = projectAssets.filter((asset) => asset.state === AssetState.Visited);
        const taggedAssets = projectAssets.filter((asset) => asset.state === AssetState.Tagged);

        return (
            <ul>
                <li title="Source Connection">
                    <i className="fas fa-upload"></i>
                    <span>{project.sourceConnection.name}</span>
                </li>
                <li title="Target Connection">
                    <i className="fas fa-download"></i>
                    <span>{project.targetConnection.name}</span>
                </li>
                <li title="Tagged Assets">
                    <i className="fas fa-tag"></i>
                    <span>{taggedAssets.length}</span>
                </li>
                <li title="Visited Assets">
                    <i className="fas fa-eye"></i>
                    <span>{visitedAssets.length}</span>
                </li>
            </ul>
        );
    }
}
