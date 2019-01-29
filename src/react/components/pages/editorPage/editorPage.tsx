import _ from "lodash";
import React, { RefObject } from "react";
import keydown from "react-keydown";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import HtmlFileReader from "../../../../common/htmlFileReader";
import {
    AssetState, EditorMode, IApplicationState, IAsset,
    IAssetMetadata, IProject, ITagMetadata, IAssetVideoSettings,
} from "../../../../models/applicationState";
import { IToolbarItemRegistration, ToolbarItemFactory } from "../../../../providers/toolbar/toolbarItemFactory";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import Canvas from "./canvas";
import EditorFooter from "./editorFooter";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import { EditorToolbar } from "./editorToolbar";
import { ToolbarItem } from "../../toolbar/toolbarItem";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";

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
export interface IEditorPageState {
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
    private canvas: RefObject<Canvas>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            project: this.props.project,
            assets: [],
            mode: EditorMode.Rectangle,
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
        this.handleTagHotKey = this.handleTagHotKey.bind(this);
        this.onTagClicked = this.onTagClicked.bind(this);
        this.onToolbarItemSelected = this.onToolbarItemSelected.bind(this);
        this.onAssetMetadataChanged = this.onAssetMetadataChanged.bind(this);
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
        const editorVideoSetting: IAssetVideoSettings = {
            shouldAutoPlayVideo: true,
            posterSource: null,
            shouldShowPlayControls: true,
        };

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
                            onToolbarItemSelected={this.onToolbarItemSelected} />
                    </div>
                    <div className="editor-page-content-body">
                        {selectedAsset &&
                            <Canvas
                                ref={this.canvas}
                                selectedAsset={this.state.selectedAsset}
                                onAssetMetadataChanged={this.onAssetMetadataChanged}
                                editorMode={this.state.mode}
                                project={this.props.project} />
                        }
                    </div>
                    <div>
                        <EditorFooter
                            displayHotKeys={true}
                            tags={this.props.project.tags}
                            onTagsChanged={this.onFooterChange}
                            onTagClicked={this.onTagClicked} />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Called when a tag from footer is clicked
     * @param tag Tag clicked
     */
    public onTagClicked(tag: ITagMetadata) {
        const selectedAsset = this.state.selectedAsset;
        if (this.canvas.current.state.selectedRegions && this.canvas.current.state.selectedRegions.length) {
            const selectedRegions = this.canvas.current.state.selectedRegions;
            selectedRegions.map((region) => {
                const selectedIndex = selectedAsset.regions.findIndex((r) => r.id === region.id);
                const selectedRegion = selectedAsset.regions[selectedIndex];
                const tagIndex = selectedRegion.tags.findIndex(
                    (existingTag) => existingTag.name === tag.name);
                if (tagIndex === -1) {
                    selectedRegion.tags.push(tag);
                } else {
                    selectedRegion.tags.splice(tagIndex, 1);
                }
                if (selectedRegion.tags.length) {
                    this.canvas.current.updateTagsById(selectedRegion.id,
                        new TagsDescriptor(selectedRegion.tags.map((tempTag) => new Tag(tempTag.name,
                            this.props.project.tags.find((t) => t.name === tempTag.name).color))));
                } else {
                    this.canvas.current.updateTagsById(selectedRegion.id, null);
                }

                return region;
            });
        }
        this.onAssetMetadataChanged(selectedAsset);
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
        let tag: ITagMetadata;
        const tags = this.props.project.tags;
        if (key === 0) {
            if (tags.length >= 10) {
                tag = { name: tags[9].name };
            }
        } else if (tags.length >= key) {
            tag = { name: tags[key - 1].name };
        }
        this.onTagClicked(tag);
    }

    private async onAssetMetadataChanged(assetMetadata: IAssetMetadata) {
        await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
        await this.props.actions.saveProject(this.props.project);
    }

    private onFooterChange(footerState) {
        const project = {
            ...this.props.project,
            tags: footerState.tags,
        };
        this.setState({ project }, async () => {
            await this.props.actions.saveProject(project);
        });
    }

    private onToolbarItemSelected(toolbarItem: ToolbarItem) {
        const setSelectionMode = this.canvas.current.setSelectionMode;
        switch (toolbarItem.props.name) {
            case "drawRectangle":
                setSelectionMode(SelectionMode.RECT);
                this.setEditorMode(EditorMode.Rectangle);
                break;
            case "drawPolygon":
                setSelectionMode(SelectionMode.POLYGON);
                this.setEditorMode(EditorMode.Polygon);
                break;
            case "copyRectangle":
                setSelectionMode(SelectionMode.COPYRECT);
                this.setEditorMode(EditorMode.CopyRect);
                break;
            case "selectCanvas":
                setSelectionMode(SelectionMode.NONE);
                this.setEditorMode(EditorMode.Select);
                break;
            case "panCanvas":
                setSelectionMode(SelectionMode.NONE);
                this.setEditorMode(EditorMode.Select);
                break;
            default:
                console.log(toolbarItem.props.name);
                break;
        }
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
