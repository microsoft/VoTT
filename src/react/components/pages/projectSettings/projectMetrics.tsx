import React from "react";
import _ from "lodash";
import { AssetState, IAsset, IAssetMetadata, IProject, IRegion, ITag } from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
import { strings, interpolate } from "../../../../common/strings";
import {
    RadialChart, XYPlot, VerticalGridLines,
    HorizontalGridLines, XAxis, YAxis, VerticalBarSeries,
} from "react-vis";
import "react-vis/dist/styles/radial-chart.scss";
import "react-vis/dist/styles/plot.scss";

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
        return (
            <div className="condensed-list">
                <h6 className="condensed-list-header bg-darker-2 p-2">
                    <i className="fas fa-chart-bar" />
                    <span>{strings.projectMetrics.title}</span>
                </h6>
                <div className="condensed-list-body">
                    {this.state.loading &&
                        <div className="loading">
                            <i className="fas fa-circle-notch fa-spin fa-2x" />
                        </div>
                    }
                    {!this.state.loading &&
                        this.renderMetrics()
                    }
                </div>
            </div>
        );
    }

    private renderMetrics() {
        const sourceAssetCount = this.getSourceAssetCount();
        const visitedAssetCount = this.getVisitedAssetsCount();
        const taggedAssetCount = this.getTaggedAssetCount();
        const nonVistedAssetCount = sourceAssetCount - this.state.projectAssetsMetadata.length;

        const assetChartData = [
            {
                angle: visitedAssetCount,
                label: interpolate(strings.projectMetrics.visitedAssets, { count: visitedAssetCount }),
            },
            {
                angle: taggedAssetCount,
                label: interpolate(strings.projectMetrics.taggedAssets, { count: taggedAssetCount }),
            },
            {
                angle: nonVistedAssetCount,
                label: interpolate(strings.projectMetrics.nonVisitedAssets, { count: nonVistedAssetCount }),
            },
        ];

        const tagChartData = [];
        this.getTagsCounts().forEach((value) => {
            tagChartData.push({
                x: value.tag.name,
                y: value.count,
                color: value.tag.color,
            });
        });

        return (
            <div className="m-3">
                <div>
                    <h4>{strings.projectMetrics.assetsSectionTitle}</h4>
                    <p className="my-1">
                        {strings.projectMetrics.totalAssetCount}:
                        <strong className="px-1 metric-total-asset-count">{sourceAssetCount}</strong>
                    </p>
                    <RadialChart
                        className="asset-chart"
                        showLabels={true}
                        data={assetChartData}
                        width={300}
                        height={300} />
                </div>
                <div className="my-3">
                    <h4>{strings.projectMetrics.tagsSectionTitle}</h4>
                    <p className="my-1">
                        {strings.projectMetrics.totalTagCount}:
                        <strong className="px-1 metric-total-tag-count">{this.props.project.tags.length}</strong>
                    </p>
                    <p className="my-1">
                        {strings.projectMetrics.totalRegionCount}:
                        <strong className="px-1 metric-total-region-count">{this.getRegionsCount()}</strong>
                    </p>
                    <p className="my-1">
                        {strings.projectMetrics.avgTagCountPerAsset}:
                        <strong className="px-1 metric-avg-tag-count">{this.getAverageTagCount()}</strong>
                    </p>
                    <XYPlot className="tag-chart"
                        margin={{ bottom: 150 }}
                        xType="ordinal"
                        colorType="literal"
                        width={300}
                        height={400}>
                        <HorizontalGridLines />
                        <XAxis tickLabelAngle={-45} />
                        <YAxis />
                        <VerticalBarSeries
                            data={tagChartData}
                        />
                    </XYPlot>
                </div>
            </div>
        );
    }

    private async getAssetsAndMetadata() {
        const assetService = new AssetService(this.props.project);
        const sourceAssets = await assetService.getAssets();

        const assetsMap = this.props.project.assets;
        const assets = _.values(assetsMap);
        const projectAssetsMetadata = await assets.mapAsync((asset) => assetService.getAssetMetadata(asset));

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

        const tags = this.getAllTagReferences();
        return (tags.length / taggedAssetCount).toFixed(2);
    }

    /**
     * The number of visited image or video frames
     */
    private getVisitedAssetsCount = () => {
        const metadata = this.state.projectAssetsMetadata;
        const visitedAssets = _.filter(metadata, (m) => {
            return m.asset.state === AssetState.Visited || m.asset.state === AssetState.Tagged;
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
     * a map of asset count per tag
     */
    private getTagsCounts = (): Map<string, { tag: ITag, count: number }> => {
        const projectTags = _.keyBy(this.props.project.tags, (tag) => tag.name);
        const tagReferences = this.getAllTagReferences();

        const map = new Map<string, { tag: ITag, count: number }>();
        tagReferences.forEach((t) => {
            const projectTag = projectTags[t];
            if (!projectTag) {
                return;
            }

            const tagMetric = map.get(t) || { tag: projectTag, count: 0 };
            tagMetric.count++;
            map.set(t, tagMetric);
        });

        this.props.project.tags.forEach((tag) => {
            if (!map.get(tag.name)) {
                map.set(tag.name, { tag, count: 0 });
            }
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
    private getAllTagReferences = (): string[] => {
        const regions = this.getRegions();

        const tags = [];
        regions.forEach((r) => {
            tags.push(r.tags);
        });

        return _.flatten<string>(tags);
    }
}
