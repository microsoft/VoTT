import React from "react";
import _ from "lodash";
import { IProject, AssetState, EditorContext } from "../../../models/applicationState";
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

        ////////////////////////////////////////////////////////////////
        // WARNING: should be updated
        const projectAssets = _.values(project.assets);
        const visitedAssets = projectAssets
            .filter((asset) => asset.state[EditorContext.Geometry] === AssetState.Visited || asset.state[EditorContext.Geometry] === AssetState.Tagged);
        const taggedAssets = projectAssets
            .filter((asset) => asset.state[EditorContext.Geometry] === AssetState.Tagged);

        return (
            <ul>
                <li title={strings.projectSettings.sourceConnection.title}>
                    <i className="fas fa-upload"></i>
                    <span className="metric-source-connection-name">{project.sourceConnection.name}</span>
                </li>
                <li title={strings.projectSettings.metadataConnection.title}>
                    <i className="fas fa-upload"></i>
                    <span className="metric-metadata-connection-name">{project.metadataConnection.name}</span>
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
