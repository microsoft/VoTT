import React, { RefObject } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import _ from "lodash";
import { IApplicationState,
        IProject,
        IAsset,
        IAssetMetadata,
        AssetState,
        ITag,
        EditorMode} from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { RouteComponentProps } from "react-router-dom";
import HtmlFileReader from "../../../../common/htmlFileReader";
import "./editorPage.scss";
import EditorFooter from "./editorFooter";
import EditorSideBar from "./editorSideBar";
import { EditorToolbar } from "./editorToolbar";
import { IToolbarItemRegistration, ToolbarItemFactory } from "../../../../providers/toolbar/toolbarItemFactory";
import Canvas from "./canvas";
import { strings } from "../../../../common/strings";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";

export interface IEditorPageProps extends RouteComponentProps, React.Props<EditorPage> {
    project: IProject;
    recentProjects: IProject[];
    actions: IProjectActions;
}

interface IEditorPageState {
    project: IProject;
    assets: IAsset[];
    mode: EditorMode;
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
    private canvas: RefObject<Canvas>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            project: this.props.project,
            assets: [],
            mode: EditorMode.Select,
        };

        this.toolbarItems = ToolbarItemFactory.getToolbarItems();

        this.canvas = React.createRef<Canvas>();

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            this.props.actions.loadProject(project);
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
                        <EditorToolbar project={this.props.project}
                            items={this.toolbarItems}
                            actions={this.props.actions}
                            canvas={this.canvas.current}
                            onEditorModeChange={this.setEditorMode.bind(this)}/>
                    </div>
                    <div className="editor-page-content-body">
                        {selectedAsset &&
                            <div className="canvas-container">
                                <Canvas
                                    ref={this.canvas}
                                    selectedAsset={this.state.selectedAsset}
                                    onAssetMetadataChanged={this.onAssetMetadataChanged.bind(this)}
                                    editorMode={this.state.mode}/>
                            </div>
                        }
                    </div>
                    <div>
                        <EditorFooter
                            tags={this.props.project.tags}
                            onTagsChanged={this.onFooterChange}
                            onTagClicked={this.onTagClicked.bind(this)} />
                    </div>
                </div>
            </div>
        );
    }

    private async onAssetMetadataChanged(assetMetadata: IAssetMetadata) {
        await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
        await this.props.actions.saveProject(this.props.project);
    }

    private onTagClicked(tag: ITag) {
        const selectedAsset = this.state.selectedAsset;
        if (selectedAsset.selectedRegions && selectedAsset.selectedRegions.length) {
            selectedAsset.selectedRegions.map((region) => {
                const tagIndex = region.tags.findIndex((existingTag) => existingTag.name === tag.name);
                if (tagIndex === -1) {
                    region.tags.push(tag);
                } else {
                    region.tags.splice(tagIndex, 1);
                }
                if (region.tags.length) {
                    this.canvas.current.updateTagsById(region.id,
                        new TagsDescriptor(region.tags.map((tempTag) => new Tag(tempTag.name, tempTag.color))));
                } else {
                    this.canvas.current.updateTagsById(region.id, null);
                }

                return region;
            });
        }
        this.onAssetMetadataChanged(selectedAsset);
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

        this.onAssetMetadataChanged(assetMetadata);

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

    private setEditorMode(mode: EditorMode) {
        this.setState({
            mode,
        });
        console.log(mode);
    }
}
