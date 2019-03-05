import React from "react";
import { FormValidation } from "react-jsonschema-form";
import { AssetState, IAsset, IAssetMetadata, IProject, IRegion } from "../../../../models/applicationState";
import "vott-react/dist/css/tagsInput.css";
import _ from "lodash";
import { AssetService } from "../../../../services/assetService";
import { strings } from "../../../../common/strings";

/**
 * Required properties for Project Metrics
 * @member project - Current project to fill metrics table
 */
export interface IProjectMetricsProps {
    project: IProject;
}

export interface IProjectMetricsState {
    loading: boolean;
    sourceAssets: IAsset[];
    projectAssetsMetadata: IAssetMetadata[];
}

/**
 * @name - Project Form
 * @description -
 */
export default class ProjectMetrics extends React.Component<IProjectMetricsProps, IProjectMetricsState> {
    public state = {
        loading: true,
        sourceAssets: [],
        projectAssetsMetadata: [],
    };

    public async componentDidMount() {
        this.setState({
            loading: true,
        });

        await this.getAssetsAndMetadata();
    }

    public render() {
        if (this.state.loading) {
            console.log("Waiting for data");
            return <h2> Loading...</h2>;
        }

        const badgeCSS = "badge badge-light badge-pill float-center";

        const tags = this.props.project.tags || [];
        const renderTagCategories = tags.map((item) => {
            return (<li>{item.name}</li>);
        });

        const tagsMap = this.getTagsCount();
        const renderTagCount = tags.map((tag) => {
            const tagName = tag.name;
            const normalizedTagName = tagName.split(" ").join("-");
            return (
                <li>
                    <b>{tagName}: </b>
                    <span className={normalizedTagName + " " + badgeCSS}>
                        {tagsMap.get(tagName) || 0}
                    </span>
                </li>
            );
        });

        return (
            <div className="project-settings-page-metrics p-3 bg-lighter-1">
                <h3>
                    <i className="fas fa-chart-bar fa-1x"/>
                    <span className="px-2">
                        {strings.projectMetrics.title}
                    </span>
                </h3>
                <ul className="list-group list-group-flush m-3">
                    <li className="list-group-item">
                        <h5>{strings.projectMetrics.sourceAssetsCount}
                            <span className={"source-asset-count " + badgeCSS}>
                                {this.getSourceAssetCount()}
                            </span>
                        </h5>
                    </li>
                    <li className="list-group-item">
                        <h5>{strings.projectMetrics.visitedAssetsCount}
                            <span className={"visited-asset-count " + badgeCSS}>
                                {this.getVisitedAssetsCount()}
                            </span>
                        </h5>
                    </li>
                    <li className="list-group-item">
                        <h5>{strings.projectMetrics.taggedAssetsCount}
                            <span className={"tagged-asset-count " + badgeCSS}>
                                {this.getTaggedAssetCount()}
                            </span>
                        </h5>
                    </li>
                    <li className="list-group-item">
                        <h5>{strings.projectMetrics.regionsCount}
                            <span className={"regions-count " + badgeCSS}>
                                {this.getRegionsCount()}
                            </span>
                        </h5>
                    </li>
                    <li className="list-group-item tag-categories">
                        <h5>{strings.projectMetrics.tagCategories}
                            <span className={"count " + badgeCSS}>
                                {this.getTagCategoriesCount()}
                            </span>
                        </h5>
                        <ul className="list">{renderTagCategories}</ul>
                    </li>
                    <li className="list-group-item">
                        <h5>{strings.projectMetrics.tagCount}   </h5>
                        <span className="tags-map">
                            <ul>{renderTagCount}</ul>
                        </span>
                    </li>
                    <li className="list-group-item">
                        <h5>{strings.projectMetrics.averageTagPerTaggedAsset}
                            <span className={"average-tag-count " + badgeCSS}>
                                {this.getAverageTagCount()}
                            </span>
                        </h5>
                    </li>
                </ul>
            </div>
        );
    }

    private async getAssetsAndMetadata() {
        const assetService = new AssetService(this.props.project);
        const sourceAssets = await assetService.getAssets();

        const assetsMap = this.props.project.assets;
        let projectAssetsMetadata = [];
        if (assetsMap) {
            const assets = _.values(assetsMap);
            const temp = assets.map((a) => assetService.getAssetMetadata(a));
            projectAssetsMetadata = await Promise.all(temp);
        }

        this.setState({
            loading: false,
            sourceAssets,
            projectAssetsMetadata,
        });
    }

    /**
     * Count the number of tagged images or video frames
     */
    private getTaggedAssetCount = () => {
        const metadata = this.state.projectAssetsMetadata;

        const taggedAssets = _.filter(metadata,
            (m) => {
                // ignore video asset root container
                return m.asset.state === AssetState.Tagged && m.regions.length > 0;
            });

        return taggedAssets.length;
    }

    /**
     * Count the avg number of tags per image or video frame
     */
    private getAverageTagCount = () => {
        const taggedAssetCount = this.getTaggedAssetCount();

        if (taggedAssetCount === 0) {
            return 0;
        }

        const tags = this.getAllTags();
        return tags.length / taggedAssetCount;
    }

    /**
     * The number of visited image or video frames
     */
    private getVisitedAssetsCount = () => {
        const metadata = this.state.projectAssetsMetadata;

        const visitedAssets = _.filter(metadata, (m) => {
            return m.asset.state === AssetState.Visited;
        });

        return visitedAssets.length;
    }

    /**
     * Total regions drawn on all assets
     */
    private getRegionsCount = () => {
        const regions = this.getRegions();
        return regions.length;
    }

    /**
     * Total number of source assets in the project
     *   Note: video frames are not counted, only the video container
     */
    private getSourceAssetCount = () => {
        const assets = this.state.sourceAssets;
        return assets.length;
    }

    /**
     * The number of tag categories in the project
     */
    private getTagCategoriesCount = (): number => {
        const tags = this.props.project.tags;
        return tags ? tags.length : 0;
    }

    /**
     * a map of asset count per tag
     */
    private getTagsCount = () => {
        const tags = this.getAllTags();

        const map = new Map();
        tags.forEach((t) => {
            const cur = map.get(t) || 0;
            map.set(t, cur + 1);
        });

        return map;
    }

    /**
     * retrieve the list of regions drawn
     */
    private getRegions = (): IRegion[] => {
        const assetsMetadata = this.state.projectAssetsMetadata;

        // find all assets with non-zero regions, extract regions
        const regions = [];
        assetsMetadata.forEach((m) => {
            if (m.regions.length > 0) {
                regions.push((m.regions));
            }
        });

        return _.flatten(regions);
    }

    /**
     * retrieve the list of tags assigned
     */
    private getAllTags = () => {
        const regions = this.getRegions();

        const tags = [];
        regions.forEach((r) => {
            tags.push(r.tags);
        });

        return _.flatten(tags);
    }
}
