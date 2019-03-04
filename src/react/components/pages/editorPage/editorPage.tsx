import _ from "lodash";
import React, { RefObject } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import HtmlFileReader from "../../../../common/htmlFileReader";
import {
    AssetState, EditorMode, IApplicationState, IAsset,
    IAssetMetadata, IProject, ITag, AssetType,
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
import { KeyboardBinding } from "../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager/keyboardManager";
import { AssetService } from "../../../../services/assetService";
import { AssetPreview, IAssetPreviewSettings } from "../../common/assetPreview/assetPreview";
import CanvasHelpers from "./canvasHelpers";
import { tagColors } from "../../../../common/tagColors";
import { ToolbarItemName } from "../../../../registerToolbar";

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
 */
export interface IEditorPageState {
    /** Project being editor */
    project: IProject;
    /** Array of assets in project */
    assets: IAsset[];
    /** The editdor mode to set for canvas tools */
    editorMode: EditorMode;
    /** The selection mode to set for canvas tools */
    selectionMode: SelectionMode;
    /** The selected asset for the primary editing experience */
    selectedAsset?: IAssetMetadata;
    /** The child assets used for nest asset typs */
    childAssets?: IAsset[];
    /** Additional settings for asset previews */
    additionalSettings?: IAssetPreviewSettings;
    /** Most recently selected tag */
    selectedTag: string;
    /** Tags locked for region labeling */
    lockedTags: string[];
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

/**
 * @name - Editor Page
 * @description - Page for adding/editing/removing tags to assets
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class EditorPage extends React.Component<IEditorPageProps, IEditorPageState> {
    public state: IEditorPageState = {
        project: this.props.project,
        selectedTag: null,
        lockedTags: [],
        selectionMode: SelectionMode.RECT,
        assets: [],
        childAssets: [],
        editorMode: EditorMode.Rectangle,
        additionalSettings: { videoSettings: (this.props.project) ? this.props.project.videoSettings : null },
    };

    private loadingProjectAssets: boolean = false;
    private toolbarItems: IToolbarItemRegistration[] = ToolbarItemFactory.getToolbarItems();
    private canvas: RefObject<Canvas> = React.createRef();

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (this.props.project) {
            await this.loadProjectAssets();
        } else if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
        }
    }

    public async componentDidUpdate() {
        if (this.props.project && this.state.assets.length === 0) {
            await this.loadProjectAssets();
        }

        // Navigating directly to the page via URL (ie, http://vott/projects/a1b2c3dEf/edit) sets the default state
        // before props has been set, this updates the project and additional settings to be valid once props are
        // retrieved.
        if (!this.state.project && this.props.project) {
            this.setState({
                project: this.props.project,
                additionalSettings: { videoSettings: (this.props.project) ? this.props.project.videoSettings : null },
            });
        }
    }

    public render() {
        const { project } = this.props;
        const { assets, selectedAsset } = this.state;
        const rootAssets = assets.filter((asset) => !asset.parent);

        if (!project) {
            return (<div>Loading...</div>);
        }

        return (
            <div className="editor-page">
                {[...Array(10).keys()].map((index) => {
                    return (<KeyboardBinding
                        key={index}
                        keyEventType={KeyEventType.KeyDown}
                        accelerators={[`${index}`]}
                        onKeyEvent={this.handleTagHotKey} />);
                })}
                <div className="editor-page-sidebar bg-lighter-1">
                    <EditorSideBar
                        assets={rootAssets}
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
                                editorMode={this.state.editorMode}
                                selectionMode={this.state.selectionMode}
                                project={this.props.project}
                                lockedTags={this.state.lockedTags}>
                                <AssetPreview
                                    additionalSettings={this.state.additionalSettings}
                                    autoPlay={true}
                                    onChildAssetSelected={this.onChildAssetSelected}
                                    asset={this.state.selectedAsset.asset}
                                    childAssets={this.state.childAssets} />
                            </Canvas>
                        }
                    </div>
                    <div>
                        <EditorFooter
                            tags={this.props.project.tags}
                            lockedTags={this.state.lockedTags}
                            onTagsChanged={this.onFooterChange}
                            onTagClicked={this.onTagClicked}
                            onCtrlTagClicked={this.onCtrlTagClicked}
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
    private onTagClicked = (tag: ITag): void => {
        this.setState({
            selectedTag: tag.name,
            lockedTags: [],
        }, () => this.canvas.current.applyTag(tag.name));
    }

    private onCtrlTagClicked = (tag: ITag): void => {
        const locked = this.state.lockedTags;
        this.setState({
            selectedTag: tag.name,
            lockedTags: CanvasHelpers.toggleTag(locked, tag.name),
        }, () => this.canvas.current.applyTag(tag.name));
    }

    /**
     * Listens for CTRL+{number key} and calls `onTagClicked` with tag corresponding to that number
     * @param event KeyDown event
     */
    private handleTagHotKey = (event: KeyboardEvent): void => {
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

    /**
     * Raised when a child asset is selected on the Asset Prview
     * ex) When a video is paused/seeked to on a video
     */
    private onChildAssetSelected = async (childAsset: IAsset) => {
        if (this.state.selectedAsset && this.state.selectedAsset.asset.id !== childAsset.id) {
            await this.selectAsset(childAsset);
        }
    }

    /**
     * Returns a value indicating whether the current asset is taggable
     */
    private isTaggableAssetType = (asset: IAsset): boolean => {
        return asset.type === AssetType.Image || asset.type === AssetType.VideoFrame;
    }

    /**
     * Raised when the selected asset has been changed.
     * This can either be a parent or child asset
     */
    private onAssetMetadataChanged = async (assetMetadata: IAssetMetadata): Promise<void> => {
        // The root asset can either be the actual asset being edited (ex: VideoFrame) or the top level / root
        // asset selected from the side bar (image/video).
        const rootAsset = { ...(assetMetadata.asset.parent || assetMetadata.asset) };

        if (this.isTaggableAssetType(assetMetadata.asset)) {
            assetMetadata.asset.state = assetMetadata.regions.length > 0 ? AssetState.Tagged : AssetState.Visited;
        } else if (assetMetadata.asset.state === AssetState.NotVisited) {
            assetMetadata.asset.state = AssetState.Visited;
        }

        // Update root asset if not already in the "Tagged" state
        // This is primarily used in the case where a Video Frame is being edited.
        // We want to ensure that in this case the root video asset state is accurately
        // updated to match that state of the asset.
        if (rootAsset.id === assetMetadata.asset.id) {
            rootAsset.state = assetMetadata.asset.state;
        } else {
            const rootAssetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, rootAsset);

            if (rootAssetMetadata.asset.state !== AssetState.Tagged) {
                rootAssetMetadata.asset.state = assetMetadata.asset.state;
                await this.props.actions.saveAssetMetadata(this.props.project, rootAssetMetadata);
            }

            rootAsset.state = rootAssetMetadata.asset.state;
        }

        await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
        await this.props.actions.saveProject(this.props.project);

        const assetService = new AssetService(this.props.project);
        const childAssets = assetService.getChildAssets(rootAsset);

        // Find and update the root asset in the internal state
        // This forces the root assets that are displayed in the sidebar to
        // accurately show their correct state (not-visited, visited or tagged)
        const assets = [...this.state.assets];
        const assetIndex = assets.findIndex((asset) => asset.id === rootAsset.id);
        if (assetIndex > -1) {
            assets[assetIndex] = {
                ...rootAsset,
            };
        }

        this.setState({ childAssets, assets });
    }

    private onFooterChange = (footerState) => {
        const project = {
            ...this.props.project,
            tags: footerState.tags,
        };
        this.setState({ project }, async () => {
            await this.props.actions.saveProject(project);
        });
    }

    private onToolbarItemSelected = async (toolbarItem: ToolbarItem): Promise<void> => {
        switch (toolbarItem.props.name) {
            case ToolbarItemName.DrawRectangle:
                this.setState({
                    selectionMode: SelectionMode.RECT,
                    editorMode: EditorMode.Rectangle,
                });
                break;
            case ToolbarItemName.DrawPolygon:
                this.setState({
                    selectionMode: SelectionMode.POLYGON,
                    editorMode: EditorMode.Polygon,
                });
                break;
            case ToolbarItemName.CopyRectangle:
                this.setState({
                    selectionMode: SelectionMode.COPYRECT,
                    editorMode: EditorMode.CopyRect,
                });
                break;
            case ToolbarItemName.SelectCanvas:
                this.setState({
                    selectionMode: SelectionMode.NONE,
                    editorMode: EditorMode.Select,
                });
                break;
            case ToolbarItemName.PreviousAsset:
                await this.goToRootAsset(-1);
                break;
            case ToolbarItemName.NextAsset:
                await this.goToRootAsset(1);
                break;
            case ToolbarItemName.CopyRegions:
                this.canvas.current.copyRegions();
                break;
            case ToolbarItemName.CutRegions:
                this.canvas.current.cutRegions();
                break;
            case ToolbarItemName.PasteRegions:
                this.canvas.current.pasteRegions();
                break;
            case ToolbarItemName.ClearRegions:
                this.canvas.current.clearRegions();
                break;
        }
    }

    /**
     * Navigates to the previous / next root asset on the sidebar
     * @param direction Number specifying asset navigation
     */
    private goToRootAsset = async (direction: number) => {
        const selectedRootAsset = this.state.selectedAsset.asset.parent || this.state.selectedAsset.asset;
        const currentIndex = this.state.assets
            .findIndex((asset) => asset.id === selectedRootAsset.id);

        if (direction > 0) {
            await this.selectAsset(this.state.assets[Math.min(this.state.assets.length - 1, currentIndex + 1)]);
        } else {
            await this.selectAsset(this.state.assets[Math.max(0, currentIndex - 1)]);
        }
    }

    private selectAsset = async (asset: IAsset): Promise<void> => {
        const assetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, asset);
        await this.updateProjectTagsFromAsset(assetMetadata);

        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.warn("Error computing asset size");
        }

        await this.onAssetMetadataChanged(assetMetadata);

        this.setState({
            selectedAsset: assetMetadata,
        });
    }

    private async updateProjectTagsFromAsset(asset: IAssetMetadata) {
        const assetTags = new Set();
        asset.regions.forEach((region) => region.tags.forEach((tag) => assetTags.add(tag)));

        const newTags: ITag[] = this.props.project.tags ? [...this.props.project.tags] : [];
        let updateTags = false;

        assetTags.forEach((tag) => {
            if (!this.props.project.tags || this.props.project.tags.length === 0 ||
                !this.props.project.tags.find((projectTag) => tag === projectTag.name) ) {
                const tagKeys = Object.keys(tagColors);
                newTags.push({
                    name: tag,
                    color: tagColors[tagKeys[newTags.length % tagKeys.length]],
                });
                updateTags = true;
            }
        });

        if (updateTags) {
            asset.asset.state = AssetState.Tagged;
            const newProject = {...this.props.project, tags: newTags};
            await this.props.actions.saveAssetMetadata(newProject, asset);
            await this.props.actions.saveProject(newProject);
        }
    }

    private loadProjectAssets = async (): Promise<void> => {
        if (this.loadingProjectAssets || this.state.assets.length > 0) {
            return;
        }

        this.loadingProjectAssets = true;

        // Get all root project assets
        const rootProjectAssets = _.values(this.props.project.assets)
            .filter((asset) => !asset.parent);

        // Get all root assets from source asset provider
        const sourceAssets = await this.props.actions.loadAssets(this.props.project);

        // Merge and uniquify
        const rootAssets = _(rootProjectAssets)
            .concat(sourceAssets)
            .uniqBy((asset) => asset.id)
            .value();

        const lastVisited = rootAssets.find((asset) => asset.id === this.props.project.lastVisitedAssetId);

        this.setState({
            assets: rootAssets,
        }, async () => {
            if (rootAssets.length > 0) {
                await this.selectAsset(lastVisited ? lastVisited : rootAssets[0]);
            }
            this.loadingProjectAssets = false;
        });
    }
}
