import _ from "lodash";
import React, { RefObject } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import SplitPane from "react-split-pane";
import { bindActionCreators } from "redux";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings";
import HtmlFileReader from "../../../../../common/htmlFileReader";
import {addLocValues, strings} from "../../../../../common/strings";
import {
    AssetState, AssetType, EditorMode, IApplicationState,
    IAppSettings, IAsset, IAssetMetadata, IProject, IRegion,
    ISize, ITag, IAdditionalPageSettings, AppError, ErrorCode, EditorContext,
} from "../../../../../models/applicationState";
import { IToolbarItemRegistration, ToolbarItemFactory } from "../../../../../providers/toolbar/toolbarItemFactory";
import IApplicationActions, * as applicationActions from "../../../../../redux/actions/applicationActions";
import IProjectActions, * as projectActions from "../../../../../redux/actions/projectActions";
import { ToolbarItemName } from "../../../../../registerToolbar";
import { AssetService } from "../../../../../services/assetService";
import { AssetPreview } from "../../../common/assetPreview/assetPreview";
import { KeyboardBinding } from "../../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../../common/keyboardManager/keyboardManager";
import { TagInput } from "../../../common/tagInput/tagInput";
import { ToolbarItem } from "../../../toolbar/toolbarItem";
import Canvas from "../canvas";
import CanvasHelpers from "../canvasHelpers";
import "../editorPage.scss";
import EditorSideBar from "../editorSideBar";
import { EditorToolbar } from "../editorToolbar";
import Alert from "../../../common/alert/alert";
import Confirm from "../../../common/confirm/confirm";
import { ActiveLearningService } from "../../../../../services/activeLearningService";
import { toast } from "react-toastify";
import Form from "react-jsonschema-form";
import CustomFieldTemplate from "../../../common/customField/customFieldTemplate";
import Preview from "./preview";
import { IEditorPageProps, IEditorPageState, mapStateToProps, mapDispatchToProps, SegmentSelectionMode } from '../editorPage';

/**
 * Properties for Editor Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 * @member applicationActions - Application setting actions
 */

/**
 * @name - Editor Page
 * @description - Page for adding/editing/removing tags to assets
 */

// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./imageAnnotationForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./imageAnnotationForm.ui.json"));

@connect(mapStateToProps, mapDispatchToProps)
export default class EditorMetadataPage extends React.Component<IEditorPageProps, IEditorPageState> {
    public state: IEditorPageState = {
        selectedTag: null,
        lockedTags: [],
        selectionMode: SelectionMode.NONE,
        segmentSelectionMode: SegmentSelectionMode.NONE,
        assets: [],
        childAssets: [],
        editorMode: EditorMode.Rectangle,
        additionalSettings: {
            videoSettings: (this.props.project) ? this.props.project.videoSettings : null,
            activeLearningSettings: (this.props.project) ? this.props.project.activeLearningSettings : null,
        },
        thumbnailSize: this.props.appSettings.thumbnailSize || { width: 220, height: 165 },
        isValid: true,
        showInvalidRegionWarning: false,
        context: EditorContext.Metadata,
    };

    private loadingProjectAssets: boolean = false;
    private canvas: RefObject<Preview> = React.createRef();

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (this.props.project) {
            await this.loadProjectAssets();
        } else if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
        }

        window.addEventListener("resize", this.onWindowResize);
    }

    public async componentDidUpdate(prevProps: Readonly<IEditorPageProps>) {
        if (this.props.project && this.state.assets.length === 0) {
            await this.loadProjectAssets();
        }

        // Navigating directly to the page via URL (ie, http://vott/projects/a1b2c3dEf/edit) sets the default state
        // before props has been set, this updates the project and additional settings to be valid once props are
        // retrieved.
        if (this.props.project && !prevProps.project) {
            this.setState({
                additionalSettings: {
                    videoSettings: (this.props.project) ? this.props.project.videoSettings : null,
                    activeLearningSettings: (this.props.project) ? this.props.project.activeLearningSettings : null,
                },
            });
        }

        if (this.props.project && prevProps.project && this.props.project.tags !== prevProps.project.tags) {
            this.updateRootAssets();
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
                            editorContext={this.state.context}
                            onBeforeAssetSelected={this.onBeforeAssetSelected}
                            onAssetSelected={this.selectAsset}
                            thumbnailSize={this.state.thumbnailSize}
                        />
                    </div>
                    <div className="editor-page-content">
                        <div className="editor-page-content-main">
                            <div className="editor-page-content-main-body" style={{ overflowY: "scroll" }}>
                                {selectedAsset &&
                                    <Form className="editor-page-content-main-body-metadata" schema={formSchema} uiSchema={uiSchema} onSubmit={() => alert("submitted")}/>}
                            </div>
                        </div>
                    </div>
                </SplitPane>
            </div>
        );
    }

    /**
     * Resizes and re-renders the canvas when the application window size changes
     */
    private onWindowResize = async () => {

        console.log(this);
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
        const regionsWithoutTags = assetMetadata.regions.filter((region) => region.tag ? region.tag.length === 0 : undefined);

        if (regionsWithoutTags.length > 0) {
            this.setState({ isValid: false });
            return;
        }

        const initialState = assetMetadata.asset.state[this.state.context];

        // The root asset can either be the actual asset being edited (ex: VideoFrame) or the top level / root
        // asset selected from the side bar (image/video).
        const rootAsset = { ...(assetMetadata.asset.parent || assetMetadata.asset) };

        if (this.isTaggableAssetType(assetMetadata.asset)) {
            assetMetadata.asset.state = {... assetMetadata.asset.state,
                [this.state.context] : assetMetadata.regions.length > 0 ? AssetState.Tagged : AssetState.Visited };
        } else if (assetMetadata.asset.state[this.state.context] === AssetState.NotVisited) {
            assetMetadata.asset.state = {... assetMetadata.asset.state, [this.state.context]: AssetState.Visited };
        }

        // Update root asset if not already in the "Tagged" state
        // This is primarily used in the case where a Video Frame is being edited.
        // We want to ensure that in this case the root video asset state is accurately
        // updated to match that state of the asset.
        if (rootAsset.id === assetMetadata.asset.id) {
            const assetMetadataObject = assetMetadata.asset.state[this.state.context];
            rootAsset.state = { ... rootAsset.state, assetMetadataObject};
        } else {
            const rootAssetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, rootAsset);

            if (rootAssetMetadata.asset.state[this.state.context] !== AssetState.Tagged) {
                const assetMetadataObject = assetMetadata.asset.state[this.state.context];
                rootAssetMetadata.asset.state = { ... rootAssetMetadata.asset.state, assetMetadataObject};
                await this.props.actions.saveAssetMetadata(this.props.project, rootAssetMetadata);
            }

            const rootAssetMetadataObject = rootAssetMetadata.asset.state[this.state.context];
            rootAsset.state = { ... rootAsset.state, rootAssetMetadataObject};
        }

        // Only update asset metadata if state changes or is different
        if (initialState !== assetMetadata.asset.state[this.state.context] || this.state.selectedAsset !== assetMetadata) {
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

    /**
     * Updates the root asset list from the project assets
     */
    private updateRootAssets = () => {
        const updatedAssets = [...this.state.assets];
        updatedAssets.forEach((asset) => {
            const projectAsset = this.props.project.assets[asset.id];
            if (projectAsset) {
                asset.state = projectAsset.state;
            }
        });

        this.setState({ assets: updatedAssets });
    }
}
