import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { AssetState, IApplicationState, IAsset, IAssetMetadata, IProject } from "../../../../models/applicationState";
import { IToolbarItemRegistration, ToolbarItemFactory } from "../../../../providers/toolbar/toolbarItemFactory";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import TagsInput from "../../common/tagsInput/tagsInput";
import AssetPreview from "./assetPreview";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import { EditorToolbar } from "./editorToolbar";

export interface IEditorPageProps extends RouteComponentProps, React.Props<EditorPage> {
    project: IProject;
    recentProjects: IProject[];
    actions: IProjectActions;
}

interface IEditorPageState {
    project: IProject;
    assets: IAsset[];
    selectedAsset?: IAssetMetadata;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class EditorPage extends React.Component<IEditorPageProps, IEditorPageState> {
    private loadingProjectAssets: boolean = false;
    private toolbarItems: IToolbarItemRegistration[] = [];

    constructor(props, context) {
        super(props, context);
        this.state = {
            project: this.props.project,
            assets: [],
        };

        this.toolbarItems = ToolbarItemFactory.getToolbarItems();

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            this.props.actions.loadProject(project);
        }

        this.selectAsset = this.selectAsset.bind(this);
        this.onTagsChanged = this.onTagsChanged.bind(this);
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
                        <EditorToolbar project={this.props.project}
                            items={this.toolbarItems}
                            actions={this.props.actions} />
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
                        {/*Footer*/}
                        <TagsInput
                            tags={(this.state.project) ? this.state.project.tags : null}
                            onChange={this.onTagsChanged}
                        />
                    </div>
                </div>
            </div>
        );
    }

    private onTagsChanged(tags) {
        this.setState({
            project: {
                ...this.state.project,
                tags,
            },
        });
    }

    private async selectAsset(asset: IAsset) {
        const assetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, asset);
        if (assetMetadata.asset.state === AssetState.NotVisited) {
            assetMetadata.asset.state = AssetState.Visited;
        }

        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.error(err);
        }

        await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
        await this.props.actions.saveProject(this.props.project);

        this.setState({
            selectedAsset: assetMetadata,
            assets: _.values(this.props.project.assets),
        });
    }

    private async loadProjectAssets() {
        if (this.loadingProjectAssets || this.state.assets.length > 0) {
            return;
        }

        this.loadingProjectAssets = true;

        await this.props.actions.loadAssets(this.props.project);
        const assets = _.values(this.props.project.assets);

        this.setState({
            assets,
        }, async () => {
            if (assets.length > 0) {
                await this.selectAsset(assets[0]);
            }
            this.loadingProjectAssets = false;
        });
    }
}
