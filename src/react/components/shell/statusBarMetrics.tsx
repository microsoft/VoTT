import React from "react";
import _ from "lodash";
import { IProject, AssetState } from "../../../models/applicationState";
import { strings, interpolate } from "../../../common/strings";

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
        const visitedAssets = projectAssets
            .filter((asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged);
        const taggedAssets = projectAssets
            .filter((asset) => asset.state === AssetState.Tagged);

        return (
            <ul>
                <li title={strings.projectSettings.sourceConnection.title}>
                    <i className="fas fa-upload"></i>
                    <span className="metric-source-connection-name">{project.sourceConnection.name}</span>
                </li>
                <li title={strings.projectSettings.targetConnection.title}>
                    <i className="fas fa-download"></i>
                    <span className="metric-target-connection-name">{project.targetConnection.name}</span>
                </li>
                <li title={interpolate(strings.projectMetrics.taggedAssets, { count: taggedAssets.length })}>
                    <i className="fas fa-tag"></i>
                    <span className="metric-tagged-asset-count">{taggedAssets.length}</span>
                </li>
                <li title={interpolate(strings.projectMetrics.visitedAssets, { count: visitedAssets.length })}>
                    <i className="fas fa-eye"></i>
                    <span className="metric-visited-asset-count">{visitedAssets.length}</span>
                </li>
            </ul>
        );
    }
}
