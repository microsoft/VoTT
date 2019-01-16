import _ from "lodash";
import React from "react";
import keydown from "react-keydown";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { strings } from "../../../../common/strings";
import { AssetState, IApplicationState, IAsset,
    IAssetMetadata, IProject, ITag } from "../../../../models/applicationState";
import { IToolbarItemRegistration, ToolbarItemFactory } from "../../../../providers/toolbar/toolbarItemFactory";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import AssetPreview from "./assetPreview";
import EditorFooter from "./editorFooter";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import { EditorToolbar } from "./editorToolbar";

/**
 * Properties for Editor Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 */
export interface IEditorPageProps extends RouteComponentProps, React.Props<EditorPage> {
    project: IProject;
    recentProjects: IProject[];
    actions: IProjectActions;
}

/**
 * State for Editor Page
 * @member project - Project being edited
 * @member assets - Array of assets in project
 */
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

function getCtrlNumericKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i <= 9; i++) {
        keys.push(`ctrl+${i.toString()}`);
    }
    return keys;
}

/**
 * @name - Editor Page
 * @description - Page for adding/editing/removing tags to assets
 */
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
        this.onFooterChange = this.onFooterChange.bind(this);
        this.handleTagHotKey = this.handleTagHotKey.bind(this);
        this.onTagClicked = this.onTagClicked.bind(this);
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
                                        {strings.editorPage.width}: {selectedAsset.asset.size.width}
                                        {strings.editorPage.height}: {selectedAsset.asset.size.height}
                                    </div>
                                }
                            </div>
                        }
                    </div>
                    <div>
                        <EditorFooter
                            displayHotKeys={true}
                            tags={this.props.project.tags}
                            onTagsChanged={this.onFooterChange}
                            onTagClicked={this.onTagClicked}
                            />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Called when a tag from footer is clicked
     * @param tag Tag clicked
     */
    public onTagClicked(tag: ITag) {
        // Stub for now, waiting for Phil's PR
        return;
    }

    /**
     * Listens for CTRL+{number key} and calls `onTagClicked` with tag corresponding to that number
     * @param event KeyDown event
     */
    @keydown(getCtrlNumericKeys())
    public handleTagHotKey(event) {
        const key = parseInt(event.key, 10);
        if (isNaN(key)) {
            return;
        }
        let tag: ITag;
        const tags = this.props.project.tags;
        if (key === 0) {
            if (tags.length >= 10) {
                tag = tags[9];
            }
        } else if (tags.length >= key) {
            tag = tags[key - 1];
        }
        this.onTagClicked(tag);
    }

    private onFooterChange(footerState) {
        const project = {
            ...this.props.project,
            tags: footerState.tags,
        };
        this.setState({project}, async () => {
            await this.props.actions.saveProject(project);
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
