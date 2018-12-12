import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import deepmerge from "deepmerge";
import { RouteComponentProps } from "react-router-dom";
import { IApplicationState, IProject, IAsset, IAssetMetadata, AssetState } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import HtmlFileReader from "../../../../common/htmlFileReader";
import "./editorPage.scss";
import AssetPreview from "./assetPreview";
import EditorFooter from "./editorFooter";
import EditorSideBar from "./editorSideBar";

interface IEditorPageProps extends RouteComponentProps, React.Props<IEditorPageProps> {
    project: IProject;
    projectActions: IProjectActions;
}

interface IEditorPageState {
    project: IProject;
    assets: IAsset[];
    selectedAsset?: IAssetMetadata;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        projectActions: bindActionCreators(projectActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class EditorPage extends React.Component<IEditorPageProps, IEditorPageState> {
    private loadingAssets: boolean = false;

    constructor(props, context) {
        super(props, context);

        this.state = {
            project: this.props.project,
            assets: [],
        };

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            this.props.projectActions.loadProject(projectId);
        }

        this.selectAsset = this.selectAsset.bind(this);
        this.onFooterChange = this.onFooterChange.bind(this);
    }

    public async componentDidMount() {
        if (this.props.project) {
            await this.loadProjectAssets();
        }
    }

    public async componentDidUpdate() {
        if (this.props.project && this.state.assets.length === 0) {
            await this.loadProjectAssets();
        }
    }

    public render() {
        const { project } = this.props;
        const { assets, selectedAsset } = this.state;

        if (!project) {
            return (<div>Loading...</div>);
        }

        return (
            <div className="editor-page">
                <div className="editor-page-sidebar bg-lighter-1">
                    <EditorSideBar
                        assets={assets}
                        selectedAsset={selectedAsset ? selectedAsset.asset : null}
                        onAssetSelected={this.selectAsset}
                    />
                </div>
                <div className="editor-page-content">
                    <div className="editor-page-content-header">
                        Header
                    </div>
                    <div className="editor-page-content-body">
                        {selectedAsset &&
                            <div className="canvas-container">
                                <AssetPreview asset={selectedAsset.asset} />
                                {selectedAsset.asset.size &&
                                    <div>
                                        Width: {selectedAsset.asset.size.width}
                                        Height: {selectedAsset.asset.size.height}
                                    </div>
                                }
                            </div>
                        }
                    </div>
                    <div>
                        <EditorFooter
                            tags={this.props.project.tags}
                            onTagsChanged={this.onFooterChange} />
                    </div>
                </div>
            </div>
        );
    }

    private onFooterChange(footerState) {
        this.setState({
            project: {
                ...this.state.project,
                tags: footerState.tags,
            },
        });
    }

    private async selectAsset(asset: IAsset) {
        if (asset.state === AssetState.NotVisited) {
            asset.state = AssetState.Visited;
        }

        const assetMetadata = await this.props.projectActions.loadAssetMetadata(this.props.project, asset);
        assetMetadata.asset.state = asset.state;

        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.error(err);
        }

        await this.props.projectActions.saveAssetMetadata(this.props.project, assetMetadata);
        await this.props.projectActions.saveProject(this.props.project);

        this.setState({
            selectedAsset: assetMetadata,
        });
    }

    private async loadProjectAssets() {
        if (this.loadingAssets || this.state.assets.length > 0) {
            return;
        }

        this.loadingAssets = true;

        // Get current project assets
        const projectAssets = { ...this.props.project.assets } || {};
        // Merge in any new assets from the asset provider
        const providerAssets = await this.props.projectActions.loadAssets(this.props.project);
        let newAssets = 0;
        providerAssets.forEach((providerAsset) => {
            if (!projectAssets[providerAsset.id]) {
                projectAssets[providerAsset.id] = providerAsset;
                newAssets++;
            }
        });

        // Update project with newly found assets
        if (newAssets > 0) {
            const projectUpdates = {
                ...this.props.project,
                assets: deepmerge({}, projectAssets),
            };
            await this.props.projectActions.saveProject(projectUpdates);
        }

        const assets = _.values(projectAssets);

        this.setState({
            assets,
        }, async () => {
            if (assets.length > 0) {
                await this.selectAsset(assets[0]);
            }
            this.loadingAssets = false;
        });
    }
}
