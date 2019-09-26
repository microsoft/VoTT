import React from "react";
import _ from "lodash";
import {
    AssetState, IAsset, IAssetMetadata,
    IProject, IRegion, ITag, IPoint, AssetType,
} from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
import { strings, interpolate } from "../../../../common/strings";
import {
    RadialChart, XYPlot, ArcSeries, Sunburst, Hint, DiscreteColorLegend,
    HorizontalGridLines, XAxis, YAxis, VerticalBarSeries,
} from "react-vis";
import "react-vis/dist/styles/radial-chart.scss";
import "react-vis/dist/styles/plot.scss";
import "./projectSettingsPage.scss";

/**
 * Required properties for Project Metrics
 * @member project - Current project to fill metrics table
 */
export interface IProjectMetricsProps {
    project: IProject;
}

export interface IProjectMetricsState {
    loading: boolean;
    hoveredCell: any;
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
        hoveredCell: null,
        sourceAssets: [],
        projectAssetsMetadata: [],
    };

    public async componentDidMount() {
        this.setState({
            loading: true,
        });

        await this.getAssetsAndMetadata();
        window.addEventListener("resize", this.refresh);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.refresh);
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

    private refresh = () => {
        this.forceUpdate();
    }

    private buildValue(hoveredCell) {
        const { radius, angle, angle0 } = hoveredCell;
        const truedAngle = (angle + angle0) / 2;
        return {
            x: radius * Math.cos(truedAngle),
            y: radius * Math.sin(truedAngle),
        };
    }

    private renderMetrics() {
        const sourceAssetCount = this.getSourceAssetCount();
        const taggedAssetCount = this.getTaggedAssetCount();
        const visitedAssetCount = this.getVisitedAssetsCount();
        const assetChartSize = window.innerWidth >= 1920 ? 250 : 200;

        const assetChartData = {
            animation: true,
            title: "asset-count",
            children: [
                {
                    title: interpolate(strings.projectMetrics.visitedAssets, { count: visitedAssetCount }),
                    children: [
                        {
                            title: interpolate(strings.projectMetrics.taggedAssets, { count: taggedAssetCount }),
                            bigness: 1,
                            children: [],
                            clr: "#70c400",
                            size: taggedAssetCount,
                            dontRotateLabel: true,
                        },
                        {
                            bigness: 1,
                            children: [],
                            clr: "#ff8c00",
                            title: interpolate(strings.projectMetrics.nonTaggedAssets,
                                { count: visitedAssetCount - taggedAssetCount }),
                            size: visitedAssetCount - taggedAssetCount,
                            dontRotateLabel: true,
                        },
                    ],
                    clr: "#4894fe",
                    dontRotateLabel: true,
                },
                {
                    title: interpolate(strings.projectMetrics.nonVisitedAssets,
                        { count: sourceAssetCount - visitedAssetCount }),
                    bigness: 1,
                    children: [],
                    clr: "#e81123",
                    dontRotateLabel: true,
                    labelStyle: {
                        fontSize: 15,
                        fontWeight: "bold",
                    },
                    size: sourceAssetCount - visitedAssetCount,
                },
            ],
        };

        const tagChartData = [];
        this.getTagsCounts().forEach((value) => {
            tagChartData.push({
                x: value.tag.name,
                y: value.count,
                color: value.tag.color,
            });
        });

        const { hoveredCell } = this.state;

        const legend = [
            {
                title: interpolate(strings.projectMetrics.visitedAssets,
                    { count: visitedAssetCount }),
                color: "#4894fe",
            },
            {
                title: interpolate(strings.projectMetrics.nonVisitedAssets,
                    { count: sourceAssetCount - visitedAssetCount }),
                color: "#e81123",
            },
            {
                title: interpolate(strings.projectMetrics.taggedAssets, { count: taggedAssetCount }),
                color: "#70c400",
            },
            {
                title: interpolate(strings.projectMetrics.nonTaggedAssets,
                    { count: visitedAssetCount - taggedAssetCount }),
                color: "#ff8c00",
            }];

        return (
            <div className="m-3">
                <h4>{strings.projectMetrics.assetsSectionTitle}</h4>
                <p className="my-1">
                    {strings.projectMetrics.totalAssetCount}:
                        <strong className="px-1 metric-total-asset-count">{sourceAssetCount}</strong><br />
                </p>
                <div className="asset-chart">
                    <Sunburst
                        data={assetChartData}
                        style={{ stroke: "#fff" }}
                        onValueMouseOver={(v) =>
                            this.setState({ hoveredCell: v.x && v.y ? v : null })
                        }
                        onValueMouseOut={(v) => this.setState({ hoveredCell: null })}
                        height={assetChartSize}
                        margin={{ top: 50, bottom: 50, left: 50, right: 50 }}
                        getLabel={(d) => d.name}
                        getSize={(d) => d.size}
                        getColor={(d) => d.clr}
                        width={assetChartSize}
                        padAngle={() => 0.05}
                        hideRootNode={true}
                    >
                        {hoveredCell ? (
                            <Hint value={this.buildValue(hoveredCell)}>
                                <div className="hint-content">
                                    <div className="hint-content-box" style={{ background: hoveredCell.clr }} />
                                    <span className="px-2">{hoveredCell.title}</span>
                                </div>
                            </Hint>
                        ) : null}
                    </Sunburst>
                    <DiscreteColorLegend items={legend} />
                </div>
                <div className="my-4">
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
        const assets = this.state.projectAssetsMetadata.map((e) => e.asset.name);
        const projectAssetSet = new Set(this.state.sourceAssets.map((e) => e.name).concat(assets));

        return projectAssetSet.size;
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
