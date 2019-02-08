import React from "react";
import * as shortid from "shortid";
import { BigPlayButton, ControlBar, CurrentTimeDisplay, PlaybackRateMenuButton,
    Player, TimeDivider, VolumeMenuButton } from "video-react";
import { CanvasTools } from "vott-ct";
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";
import { RegionData } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { ClipBoard } from "../../../../common/clipboard";
import { strings } from "../../../../common/strings";
import { AppError, AssetState, AssetType, EditorMode, ErrorCode,
    IAssetMetadata, IProject, IRegion, ITag, RegionType } from "../../../../models/applicationState";
import { KeyboardBinding } from "../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager/keyboardManager";
import CanvasHelpers from "./canvasHelpers";

export interface ICanvasProps {
    selectedAsset: IAssetMetadata;
    onAssetMetadataChanged: (assetMetadata: IAssetMetadata) => void;
    editorMode: EditorMode;
    project: IProject;
    onTagLocked?: (tag: ITag) => void;
}

interface ICanvasState {
    loaded: boolean;
    selectedRegions?: IRegion[];
    canvasEnabled: boolean;
    lockedTags: ITag[];
    multiSelect: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    public editor: Editor;

    public state: ICanvasState = {
        loaded: false,
        selectedRegions: [],
        canvasEnabled: true,
        lockedTags: [],
        multiSelect: false,
    };

    private clipBoard: ClipBoard<IRegion[]> = new ClipBoard<IRegion[]>();

    private videoPlayer: React.RefObject<Player> = React.createRef<Player>();

    public componentDidMount = async () => {
        const sz = document.getElementById("editor-zone") as HTMLDivElement;
        this.editor = new CanvasTools.Editor(sz);
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMove = this.onRegionMove;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;

        // Upload background image for selection
        await this.updateEditor();
    }

    public componentDidUpdate = async (prevProps) => {
        if (this.props.selectedAsset.asset.path !== prevProps.selectedAsset.asset.path) {
            await this.updateEditor();
            if (this.props.selectedAsset.regions.length) {
                this.setState({
                    selectedRegions: []
                })
            }
        }
    }

    public render = () => {
        const { selectedAsset } = this.props;

        return (
            <div id="ct-zone" className={this.state.canvasEnabled ? "canvas-enabled" : "canvas-disabled"}>
                <KeyboardBinding
                    keyEventType={KeyEventType.KeyDown}
                    accelerator={"Shift"}
                    onKeyEvent={() => this.setMultiSelect(true)}
                />
                <KeyboardBinding
                    keyEventType={KeyEventType.KeyUp}
                    accelerator={"Shift"}
                    onKeyEvent={() => this.setMultiSelect(false)}
                />
                <KeyboardBinding
                    keyEventType={KeyEventType.KeyDown}
                    accelerator={"Ctrl+c"}
                    onKeyEvent={this.copyRegions}
                />
                <KeyboardBinding
                    keyEventType={KeyEventType.KeyDown}
                    accelerator={"Ctrl+x"}
                    onKeyEvent={this.cutRegions}
                />
                <KeyboardBinding
                    keyEventType={KeyEventType.KeyDown}
                    accelerator={"Ctrl+v"}
                    onKeyEvent={this.pasteRegions}
                />
                <KeyboardBinding
                    keyEventType={KeyEventType.KeyDown}
                    accelerator={"Ctrl+a"}
                    onKeyEvent={this.selectAllRegions}
                />
                <KeyboardBinding
                    keyEventType={KeyEventType.KeyDown}
                    accelerator={"Ctrl+d"}
                    onKeyEvent={this.clearRegions}
                />

                {selectedAsset.asset.type === AssetType.Video &&
                    <Player ref={this.videoPlayer}
                        fluid={false} width={"100%"} height={"100%"}
                        autoPlay={true}
                        poster={""}
                        src={`${selectedAsset.asset.path}`}
                    >
                        <BigPlayButton position="center" />
                        <ControlBar>
                            <CurrentTimeDisplay order={1.1} />
                            <TimeDivider order={1.2} />
                            <PlaybackRateMenuButton rates={[5, 2, 1, 0.5, 0.25]} order={7.1} />
                            <VolumeMenuButton enabled order={7.2} />
                        </ControlBar>
                    </Player>
                }
                <div id="selection-zone" className={`asset-${this.getAssetType()}`}>
                    <div id="editor-zone" className="full-size" />
                </div>
            </div>
        );
    }

    /**
     * Method that gets called when a new region is drawn
     * @param {RegionData} commit the RegionData of created region
     * @returns {void}
     */
    public onSelectionEnd = (commit: RegionData) => {
        const id = shortid.generate();

        this.editor.RM.addRegion(id, commit, null);

        // RegionData not serializable so need to extract data
        const scaledRegionData = this.editor.scaleRegionToSourceSize(commit);
        const newRegion = {
            id,
            type: this.editorModeToType(this.props.editorMode),
            tags: [],
            boundingBox: {
                height: scaledRegionData.height,
                width: scaledRegionData.width,
                left: scaledRegionData.x,
                top: scaledRegionData.y,
            },
            points: scaledRegionData.points,
        };
        // Apply locked tags if there are some
        if (this.state.lockedTags) {
            for (const tag of this.state.lockedTags) {
                this.toggleTagOnRegion(newRegion, tag);
            }
        }
        const currentAssetMetadata = this.addRegionToAsset(newRegion);
        this.props.onAssetMetadataChanged(currentAssetMetadata);
        this.setState({
            selectedRegions: [ newRegion ]
        })
    }

    /**
     * Add tag to or remove tag from selected regions
     * @param tag Tag to apply to or remove from selected regions
     */
    public onTagClicked = (tag: ITag) => {
        for (const region of this.state.selectedRegions) {
            this.toggleTagOnRegion(region, tag);
        }
    }

    public onTagShiftClicked = (tag: ITag) => {
        this.setState((prevState) => {
            return {
                lockedTags: CanvasHelpers.toggleTag(prevState.lockedTags, tag),
            };
        }, () => {
            if (this.props.onTagLocked) {
                this.props.onTagLocked(tag);
            }
        });
    }

    public onTagCtrlShiftClicked = (tag: ITag) => {
        console.log("Ctrl shift clicked");
    }

    /**
     * Method called when moving a region already in the editor
     * @param {string} id the id of the region that was moved
     * @param {RegionData} regionData the RegionData of moved region
     * @returns {void}
     */
    public onRegionMove = (id: string, regionData: RegionData) => {
        const ct = CanvasTools;
        const currentAssetMetadata = this.props.selectedAsset;
        const movedRegionIndex = currentAssetMetadata.regions.findIndex((region) => region.id === id);
        const movedRegion = currentAssetMetadata.regions[movedRegionIndex];
        const scaledRegionData = this.editor.scaleRegionToSourceSize(regionData);

        if (movedRegion) {
            movedRegion.points = scaledRegionData.points;
        }

        currentAssetMetadata.regions[movedRegionIndex] = movedRegion;
        this.setState({
            selectedRegions: [ movedRegion ]
        })
        this.props.onAssetMetadataChanged(currentAssetMetadata);
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @returns {void}
     */
    public onRegionDelete = (id: string) => {
        // Remove from Canvas Tools
        this.editor.RM.deleteRegionById(id);
        const currentAssetMetadata = this.deleteRegionFromAsset(id);

        this.props.onAssetMetadataChanged(currentAssetMetadata);
        this.setState({
            selectedRegions: []
        })
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @param {boolean} multiselection boolean whether multiselect is active
     * @returns {void}
     */
    public onRegionSelected = (id: string) => {
        let selectedRegions = this.state.selectedRegions;

        const selectedRegion = this.props.selectedAsset.regions.find((region) => region.id === id);

        if (this.state.multiSelect) {
            selectedRegions.push(selectedRegion);
        } else {
            selectedRegions = [selectedRegion];
        }
        this.setState({ selectedRegions });     
    }

    private setMultiSelect = (multiSelect: boolean) => {
        if (multiSelect !== this.state.multiSelect) {
            this.setState({ multiSelect });
        }
    }

    /**
     * Add tag to region if not there already, remove tag from region
     * if already contained in tags. Update tags in CanvasTools editor
     * @param region Region to add or remove tag
     * @param tag Tag to add or remove from region
     */
    private toggleTagOnRegion = (region: IRegion, tag: ITag) => {
        if (!region || !tag) {
            return;
        }
        CanvasHelpers.toggleTag(region.tags, tag);
        this.editor.RM.updateTagsById(region.id, CanvasHelpers.getTagsDescriptor(region));
    }

    private copyRegions = () => {
        if (this.state.selectedRegions) {
            this.clipBoard.set(this.state.selectedRegions);
        }
    }

    private cutRegions = () => {
        this.copyRegions();
        for (const region of this.state.selectedRegions) {
            this.onRegionDelete(region.id);
        }
    }

    private pasteRegions = () => {
        const regions = this.clipBoard.get();
        if (regions) {
            const newRegions = regions.map(
                (region) => CanvasHelpers.duplicateAndTransformRegion(region, this.props.selectedAsset.regions));
            this.addRegions(newRegions);
        }
    }

    private clearRegions = () => {
        const regions = this.props.selectedAsset.regions;
        if (regions && regions.length) {
            let currentAssetMetadata: IAssetMetadata;
            for (const region of regions) {
                console.log(`Deleting region ${region.id}`);
                this.editor.RM.deleteRegionById(region.id);
                currentAssetMetadata = this.deleteRegionFromAsset(region.id);
            }
            this.props.onAssetMetadataChanged(currentAssetMetadata);
        }
    }

    private addRegionToAsset = (region: IRegion): IAssetMetadata => {
        const currentAssetMetadata = this.props.selectedAsset;
        currentAssetMetadata.regions.push(region);

        if (currentAssetMetadata.regions.length) {
            currentAssetMetadata.asset.state = AssetState.Tagged;
        }

        return currentAssetMetadata;
    }

    private deleteRegionFromAsset = (id: string): IAssetMetadata => {
        // Remove from project
        const currentAssetMetadata = this.props.selectedAsset;
        const deletedRegionIndex = this.props.selectedAsset.regions.findIndex((region) => region.id === id);
        currentAssetMetadata.regions.splice(deletedRegionIndex, 1);

        if (!currentAssetMetadata.regions.length) {
            currentAssetMetadata.asset.state = AssetState.Visited;
        }
        return currentAssetMetadata;
    }

    private addRegions = (regions: IRegion[]) => {
        let currentAssetMetadata: IAssetMetadata;
        for (const region of regions) {
            this.editor.RM.addRegion(
                region.id,
                CanvasHelpers.getRegionData(region),
                CanvasHelpers.getTagsDescriptor(region));
            currentAssetMetadata = this.addRegionToAsset(region);
        }
        this.props.onAssetMetadataChanged(currentAssetMetadata);
    }

    /**
     * Updates the background of the canvas and draws the asset's regions
     */
    private updateEditor = async () => {
        this.editor.RM.deleteAllRegions();
        await this.loadAsset();
    }

    /**
     * Loads the asset into the canvas editor
     */
    private loadAsset = async () => {
        // We need to check if we're looking for a video or image
        if (this.props.selectedAsset.asset.type === AssetType.Image) {
            await this.loadImage();
        } else if (this.props.selectedAsset.asset.type === AssetType.Video) {
            await this.loadVideo();
        } else {
            // We don't know what type of asset this is?
            throw new AppError(ErrorCode.CanvasError, strings.editorPage.assetError);
        }
    }

    /**
     *  loads a video into the canvas
     */
    private loadVideo = () => {
        this.setState({ canvasEnabled: false });
        this.videoPlayer.current.subscribeToStateChange(this.onVideoStateChange);

        return Promise.resolve();
    }

    /**
     * loads an image into the canvas
     */
    private loadImage = () => {
        return new Promise((resolve) => {
            const image = new Image();
            image.addEventListener("load", async (e) => {
                await this.editor.addContentSource(e.target as HTMLImageElement);
                this.updateRegions();
                resolve();
            });
            image.src = this.props.selectedAsset.asset.path;
        });
    }

    /**
     * Reacts to changes in the video player state
     * @param state The current state of the video player
     * @param prev The previous state of the video player
     */
    private onVideoStateChange = async (state, prev) => {
        // If the video is paused, add this frame to the editor content
        if (state.paused && (state.currentTime !== prev.currentTime || state.seeking !== prev.seeking)) {
            // If we're paused, make sure we're behind the canvas so we can tag
            const video = this.videoPlayer.current.video.video as HTMLVideoElement;
            if (video.videoHeight > 0 && video.videoWidth > 0) {
                await this.editor.addContentSource(video);
            }
            this.setState({ canvasEnabled: true });
            this.updateRegions();
        } else if (!state.paused && state.paused !== prev.paused) {
            // We need to make sure we're on top if we are playing
            this.setState({ canvasEnabled: false });
        }
    }

    private updateRegions = () => {
        if (this.props.selectedAsset.regions.length) {
            this.props.selectedAsset.regions.forEach((region: IRegion) => {
                const loadedRegionData = CanvasHelpers.getRegionData(region);
                this.editor.RM.addRegion(
                    region.id,
                    this.editor.scaleRegionToFrameSize(loadedRegionData),
                    CanvasHelpers.getTagsDescriptor(region));

                if (this.state.selectedRegions) {
                    this.setState({
                        selectedRegions: [this.props.selectedAsset.regions[
                            this.props.selectedAsset.regions.length - 1]],
                    });
                }
            });
        }
    }

    private selectAllRegions = () => {
        this.setState({ selectedRegions: this.props.selectedAsset.regions });
    }

    private getAssetType = () => {
        switch (this.props.selectedAsset.asset.type) {
            case AssetType.Image:
                return "image";
            case AssetType.Video:
                return "video";
            default:
                return "unknown";
        }
    }

    private editorModeToType = (editorMode: EditorMode) => {
        let type;
        switch (editorMode) {
            case EditorMode.Rectangle:
                type = RegionType.Rectangle;
                break;
            case EditorMode.Polygon:
                type = RegionType.Polygon;
                break;
            case EditorMode.Point:
                type = RegionType.Point;
                break;
            case EditorMode.Polyline:
                type = RegionType.Polyline;
                break;
            default:
                break;
        }
        return type;
    }
}
