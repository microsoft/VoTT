import _ from "lodash";
import React, { RefObject } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import SplitPane from "react-split-pane";
import { bindActionCreators } from "redux";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { strings } from "../../../../common/strings";
import {
    AssetState, AssetType, EditorMode, IApplicationState,
    IAppSettings, IAsset, IAssetMetadata, IProject, IRegion,
    ISize, ITag,
} from "../../../../models/applicationState";
import { IToolbarItemRegistration, ToolbarItemFactory } from "../../../../providers/toolbar/toolbarItemFactory";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { ToolbarItemName } from "../../../../registerToolbar";
import { AssetService } from "../../../../services/assetService";
import { AssetPreview, IAssetPreviewSettings } from "../../common/assetPreview/assetPreview";
import { KeyboardBinding } from "../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager/keyboardManager";
import { TagInput } from "../../common/tagInput/tagInput";
import { ToolbarItem } from "../../toolbar/toolbarItem";
import Canvas from "./canvas";
import CanvasHelpers from "./canvasHelpers";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import { EditorToolbar } from "./editorToolbar";
import Alert from "../../common/alert/alert";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../../common/tagColors.json");

/**
 * Properties for Editor Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 * @member applicationActions - Application setting actions
 */
export interface IEditorPageProps extends RouteComponentProps, React.Props<EditorPage> {
    project: IProject;
    recentProjects: IProject[];
    appSettings: IAppSettings;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
}

interface IExportPageSettings extends IAssetPreviewSettings {
    activeLearningSettings: IProjectActiveLearningSettings;
}

/**
 * State for Editor Page
 */
export interface IEditorPageState {
    /** Project being editor */
    project: IProject;
    /** Array of assets in project */
    assets: IAsset[];
    /** The editor mode to set for canvas tools */
    editorMode: EditorMode;
    /** The selection mode to set for canvas tools */
    selectionMode: SelectionMode;
    /** The selected asset for the primary editing experience */
    selectedAsset?: IAssetMetadata;
    /** Currently selected region on current asset */
    selectedRegions?: IRegion[];
    /** The child assets used for nest asset typs */
    childAssets?: IAsset[];
    /** Additional settings for asset previews */
    additionalSettings?: IExportPageSettings;
    /** Most recently selected tag */
    selectedTag: string;
    /** Tags locked for region labeling */
    lockedTags: string[];
    /** Size of the asset thumbnails to display in the side bar */
    thumbnailSize: ISize;
    /**
     * Whether or not the editor is in a valid state
     * State is invalid when a region has not been tagged
     */
    isValid: boolean;
    /** Whether the show invalid region warning alert should display */
    showInvalidRegionWarning: boolean;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        project: state.currentProject,
        appSettings: state.appSettings,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
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
        thumbnailSize: this.props.appSettings.thumbnailSize || { width: 175, height: 155 },
        isValid: true,
        showInvalidRegionWarning: false,
    };

    // Use Electron Remote to load and use TF.js model from main electron process
    private remote: Electron.Remote;

    // TensorFlow model used for Active Learning
    private model: ObjectDetection;

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

        // Load standard TensorFlow.js SSD Model trained on COCO dataset
        this.model = await load("mobilenet_v2");
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
                additionalSettings: { videoSettings: (this.props.project) ? this.props.project.videoSettings : null,
                    activeLearningSettings: (this.props.project) ? this.props.project.activeLearningSettings : null },
            });
        }

        if (this.state.project &&
            this.state.project.activeLearningSettings.autolabel &&
            this.state.selectedAsset &&
            !this.state.selectedAsset.asset.predicted) {
            this.predict();
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
                        displayName={strings.editorPage.tags.hotKey.apply}
                        key={index}
                        keyEventType={KeyEventType.KeyDown}
                        accelerators={[`${index}`]}
                        icon={"fa-tag"}
                        handler={this.handleTagHotKey} />);
                })}
                {[...Array(10).keys()].map((index) => {
                    return (<KeyboardBinding
                        displayName={strings.editorPage.tags.hotKey.lock}
                        key={index}
                        keyEventType={KeyEventType.KeyDown}
                        accelerators={[`CmdOrCtrl+${index}`]}
                        icon={"fa-lock"}
                        handler={this.handleCtrlTagHotKey} />);
                })}
                <SplitPane split="vertical"
                    defaultSize={this.state.thumbnailSize.width}
                    minSize={100}
                    maxSize={400}
                    paneStyle={{ display: "flex" }}
                    onChange={this.onSideBarResize}
                    onDragFinished={this.onSideBarResizeComplete}>
                    <div className="editor-page-sidebar bg-lighter-1">
                        <EditorSideBar
                            assets={rootAssets}
                            selectedAsset={selectedAsset ? selectedAsset.asset : null}
                            onBeforeAssetSelected={this.onBeforeAssetSelected}
                            onAssetSelected={this.selectAsset}
                            thumbnailSize={this.state.thumbnailSize}
                        />
                    </div>
                    <div className="editor-page-content" onClick={this.onPageClick}>
                        <div className="editor-page-content-main">
                            <div className="editor-page-content-main-header">
                                <EditorToolbar project={this.props.project}
                                    items={this.toolbarItems}
                                    actions={this.props.actions}
                                    onToolbarItemSelected={this.onToolbarItemSelected} />
                            </div>
                            <div className="editor-page-content-main-body">
                                {selectedAsset &&
                                    <Canvas
                                        ref={this.canvas}
                                        selectedAsset={this.state.selectedAsset}
                                        onAssetMetadataChanged={this.onAssetMetadataChanged}
                                        onSelectedRegionsChanged={this.onSelectedRegionsChanged}
                                        editorMode={this.state.editorMode}
                                        selectionMode={this.state.selectionMode}
                                        project={this.props.project}
                                        lockedTags={this.state.lockedTags}>
                                        <AssetPreview
                                            additionalSettings={this.state.additionalSettings}
                                            autoPlay={true}
                                            controlsEnabled={this.state.isValid}
                                            onBeforeAssetChanged={this.onBeforeAssetSelected}
                                            onChildAssetSelected={this.onChildAssetSelected}
                                            asset={this.state.selectedAsset.asset}
                                            childAssets={this.state.childAssets} />
                                    </Canvas>
                                }
                            </div>
                        </div>
                        <div className="editor-page-right-sidebar">
                            <TagInput
                                tags={this.props.project.tags}
                                lockedTags={this.state.lockedTags}
                                selectedRegions={this.state.selectedRegions}
                                onChange={this.onTagsChanged}
                                onLockedTagsChange={this.onLockedTagsChanged}
                                onTagClick={this.onTagClicked}
                                onCtrlTagClick={this.onCtrlTagClicked}
                            />
                        </div>
                    </div>
                </SplitPane>
                <Alert show={this.state.showInvalidRegionWarning}
                    title={strings.editorPage.messages.enforceTaggedRegions.title}
                    // tslint:disable-next-line:max-line-length
                    message={strings.editorPage.messages.enforceTaggedRegions.description}
                    closeButtonColor="info"
                    onClose={() => this.setState({ showInvalidRegionWarning: false })} />
            </div>
        );
    }

    private onPageClick = () => {
        this.setState({
            selectedRegions: [],
        });
    }

    /**
     * Called when the asset side bar is resized
     * @param newWidth The new sidebar width
     */
    private onSideBarResize = (newWidth: number) => {
        this.setState({
            thumbnailSize: {
                width: newWidth,
                height: newWidth / (4 / 3),
            },
        }, () => this.canvas.current.forceResize());
    }

    /**
     * Called when the asset sidebar has been completed
     */
    private onSideBarResizeComplete = () => {
        const appSettings = {
            ...this.props.appSettings,
            thumbnailSize: this.state.thumbnailSize,
        };

        this.props.applicationActions.saveAppSettings(appSettings);
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

    private getTagFromKeyboardEvent = (event: KeyboardEvent): ITag => {
        let key = parseInt(event.key, 10);
        if (isNaN(key)) {
            try {
                key = parseInt(event.key.split("+")[1], 10);
            } catch (e) {
                return;
            }
        }
        let index: number;
        const tags = this.props.project.tags;
        if (key === 0 && tags.length >= 10) {
            index = 9;
        } else if (key < 10) {
            index = key - 1;
        }
        if (index < tags.length) {
            return tags[index];
        }
        return null;
    }

    /**
     * Listens for {number key} and calls `onTagClicked` with tag corresponding to that number
     * @param event KeyDown event
     */
    private handleTagHotKey = (event: KeyboardEvent): void => {
        const tag = this.getTagFromKeyboardEvent(event);
        if (tag) {
            this.onTagClicked(tag);
        }
    }

    private handleCtrlTagHotKey = (event: KeyboardEvent): void => {
        const tag = this.getTagFromKeyboardEvent(event);
        if (tag) {
            this.onCtrlTagClicked(tag);
        }
    }

    /**
     * Raised when a child asset is selected on the Asset Preview
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
        return asset.type !== AssetType.Unknown && asset.type !== AssetType.Video;
    }

    /**
     * Raised when the selected asset has been changed.
     * This can either be a parent or child asset
     */
    private onAssetMetadataChanged = async (assetMetadata: IAssetMetadata): Promise<void> => {
        // If the asset contains any regions without tags, don't proceed.
        const regionsWithoutTags = assetMetadata.regions.filter((region) => region.tags.length === 0);

        if (regionsWithoutTags.length > 0) {
            this.setState({ isValid: false });
            return;
        }

        const initialState = assetMetadata.asset.state;

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

        // Only update asset metadata if state changes or is different
        if (initialState !== assetMetadata.asset.state || this.state.selectedAsset !== assetMetadata) {
            await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
        }

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

        this.setState({ childAssets, assets, isValid: true });
    }

    private onSelectedRegionsChanged = (selectedRegions: IRegion[]) => {
        this.setState({ selectedRegions });
    }

    private onTagsChanged = (tags) => {
        const project = {
            ...this.props.project,
            tags,
        };
        this.setState({ project }, async () => {
            await this.props.actions.saveProject(project);
            if (this.canvas.current) {
                this.canvas.current.updateCanvasToolsRegions();
            }
        });
    }

    private onLockedTagsChanged = (lockedTags: string[]) => {
        this.setState({ lockedTags });
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
            case ToolbarItemName.RemoveAllRegions:
                this.canvas.current.confirmRemoveAllRegions();
                break;
            case ToolbarItemName.ActiveLearning:
                await this.predict();
                break;
        }
    }

    private predict = async () => {
        if (this.model) {
            const imageBuffer = await HtmlFileReader.getAssetArray(this.state.selectedAsset.asset);
            const buffer = Buffer.from(imageBuffer);
            const image64 = btoa(buffer.reduce((data, byte) => data + String.fromCharCode(byte), ""));
            const image = document.createElement("img") as HTMLImageElement;
            image.onload = async () => {
                const predictions = await this.model.detect(image);
                console.log(image.x, image.y, image.width, image.height);
                console.log(predictions);

                const regions = [...this.state.selectedAsset.regions];
                predictions.forEach((prediction) => {
                    // check if it is a new region
                    if (regions.length === 0 || !regions.find((region) => region.boundingBox &&
                            region.boundingBox.left === Math.max(0, prediction.bbox[0]) &&
                            region.boundingBox.top === Math.max(0, prediction.bbox[1]) &&
                            region.boundingBox.width === Math.max(0, prediction.bbox[2]) &&
                            region.boundingBox.height === Math.max(0, prediction.bbox[3]))) {
                        regions.push({
                            id: shortid.generate(),
                            type: RegionType.Rectangle,
                            tags: this.state.project.activeLearningSettings.predictClass ? [prediction.class] : [],
                            boundingBox: {
                                left: Math.max(0, prediction.bbox[0]),
                                top: Math.max(0, prediction.bbox[1]),
                                width: Math.max(0, prediction.bbox[2]),
                                height: Math.max(0, prediction.bbox[3]),
                            },
                            points: [{
                                x: Math.max(0, prediction.bbox[0]),
                                y: Math.max(0, prediction.bbox[1]),
                            },
                            {
                                x: Math.max(0, prediction.bbox[0]) + Math.max(0, prediction.bbox[2]),
                                y: Math.max(0, prediction.bbox[1]),
                            },
                            {
                                x: Math.max(0, prediction.bbox[0]) + Math.max(0, prediction.bbox[2]),
                                y: Math.max(0, prediction.bbox[1]) + Math.max(0, prediction.bbox[3]),
                            },
                            {
                                x: Math.max(0, prediction.bbox[0]),
                                y: Math.max(0, prediction.bbox[1]) + Math.max(0, prediction.bbox[3]),
                            }],
                        });
                    }
                });

                this.canvas.current.addRegionsToAsset(regions);
                this.canvas.current.addRegionsToCanvasTools(regions);

                const newAsset = { ...this.state.selectedAsset, regions };
                newAsset.asset.predicted = true;
                console.log(newAsset);

                this.onAssetMetadataChanged(newAsset);

                this.setState({
                    selectedAsset: newAsset,
                });

                // Save
                await this.props.actions.saveAssetMetadata(this.props.project, newAsset);
                await this.props.actions.saveProject(this.props.project);
            };
            image.src = "data:image;base64," + image64;
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

    private onBeforeAssetSelected = (): boolean => {
        if (!this.state.isValid) {
            this.setState({ showInvalidRegionWarning: true });
        }

        return this.state.isValid;
    }

    private selectAsset = async (asset: IAsset): Promise<void> => {
        // Nothing to do if we are already on the same asset.
        if (this.state.selectedAsset && this.state.selectedAsset.asset.id === asset.id) {
            return;
        }

        if (!this.state.isValid) {
            this.setState({ showInvalidRegionWarning: true });
            return;
        }

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

        this.setState({
            selectedAsset: assetMetadata,
        }, async () => {
            await this.onAssetMetadataChanged(assetMetadata);
        });
    }

    private async updateProjectTagsFromAsset(asset: IAssetMetadata) {
        const assetTags = new Set();
        asset.regions.forEach((region) => region.tags.forEach((tag) => assetTags.add(tag)));

        const newTags: ITag[] = this.props.project.tags ? [...this.props.project.tags] : [];
        let updateTags = false;

        assetTags.forEach((tag) => {
            if (!this.props.project.tags || this.props.project.tags.length === 0 ||
                !this.props.project.tags.find((projectTag) => tag === projectTag.name)) {
                newTags.push({
                    name: tag,
                    color: tagColors[newTags.length % tagColors.length],
                });
                updateTags = true;
            }
        });

        if (updateTags) {
            asset.asset.state = AssetState.Tagged;
            const newProject = { ...this.props.project, tags: newTags };
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
