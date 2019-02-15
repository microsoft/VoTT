import React, { Fragment, ReactElement } from "react";
import * as shortid from "shortid";
import { CanvasTools } from "vott-ct";
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";
import { RegionData } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { ClipBoard } from "../../../../common/clipboard";
import { AssetState, EditorMode, IAssetMetadata, IProject,
    IRegion, ITag, RegionType, IAsset } from "../../../../models/applicationState";
import { AssetPreview, ContentSource } from "../../common/assetPreview/assetPreview";
import { KeyboardBinding } from "../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager/keyboardManager";
import CanvasHelpers from "./canvasHelpers";

export interface ICanvasProps extends React.Props<Canvas> {
    selectedAsset: IAssetMetadata;
    editorMode: EditorMode;
    selectionMode: SelectionMode;
    project: IProject;
    lockedTags: ITag[];
    selectedTag: ITag;
    children?: ReactElement<AssetPreview>;
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
}

export interface ICanvasState {
    currentAsset: IAssetMetadata;
    contentSource: ContentSource;
    selectedRegions?: IRegion[];
    canvasEnabled: boolean;
    multiSelect: boolean;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {

    public editor: Editor;

    public state: ICanvasState = {
        currentAsset: this.props.selectedAsset,
        contentSource: null,
        selectedRegions: [],
        canvasEnabled: true,
        multiSelect: false,
    };

    private clipBoard: ClipBoard<IRegion[]> = new ClipBoard<IRegion[]>();

    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();

    public componentDidMount = () => {
        const sz = document.getElementById("editor-zone") as HTMLDivElement;
        this.editor = new CanvasTools.Editor(sz);
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMove = this.onRegionMove;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;
        this.editor.setSelectionMode(this.props.selectionMode, null);

        window.addEventListener("resize", this.onWindowResize);

        this.clearAllRegions();
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.onWindowResize);
    }

    public componentDidUpdate = (prevProps: Readonly<ICanvasProps>) => {
        if (this.props.selectedAsset.asset.id !== prevProps.selectedAsset.asset.id) {
            this.clearAllRegions();
            if (this.props.selectedAsset.regions.length) {
                this.setState({
                    currentAsset: this.props.selectedAsset,
                    selectedRegions: [],
                });
            }
        }

        if (this.props.selectionMode !== prevProps.selectionMode) {
            this.editor.setSelectionMode(this.props.selectionMode, null);
        }

        if (this.props.lockedTags !== prevProps.lockedTags || this.props.selectedTag !== prevProps.selectedTag) {
            if (!(CanvasHelpers.nullOrEmpty(this.props.lockedTags) && !this.props.selectedTag)) {
                const regions = CanvasHelpers.applyTagsToRegions(
                    this.state.selectedRegions, this.props.lockedTags, this.props.selectedTag);
                this.updateAssetRegions(regions);
            }
        }
    }

    public render = () => {
        return (

            <Fragment>
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
                <div id="ct-zone"
                    ref={this.canvasZone}
                    className={this.state.canvasEnabled ? "canvas-enabled" : "canvas-disabled"}>
                    <div id="selection-zone">
                        <div id="editor-zone" className="full-size" />
                    </div>
                </div>
                {this.renderChildren()}
            </Fragment>
        );
    }

    /**
     * Method called when selecting a region from the editor
     * @param {string} id the id of the deleted region
     * @returns {void}
     */
    public onRegionSelected = (id: string) => {

        const selectedRegion = this.getRegion(this.state.currentAsset.regions, id);

        let selectedRegions = this.state.selectedRegions;

        if (this.state.multiSelect && selectedRegions) {
            if (!this.getRegion(selectedRegions, id)) {
                selectedRegions.push(selectedRegion);
            } else {
                selectedRegions = selectedRegions.filter((r) => r.id !== id);
            }
        } else {
            selectedRegions = [selectedRegion];
        }
        const taggedRegions = CanvasHelpers.applyTagsToRegions(selectedRegions, this.props.lockedTags);
        this.updateAssetRegions(taggedRegions);
        this.setState({ selectedRegions: taggedRegions });
    }

    private setAssetRegions = (regions: IRegion[], selectedRegions?: IRegion[]) => {
        if (!regions) {
            return;
        }
        const asset: IAssetMetadata = {
            ...this.state.currentAsset,
            regions,
        };
        const state = (selectedRegions) ? {
            currentAsset: asset,
            selectedRegions,
        } : {
            currentAsset: asset,
        };
        this.setState(state, () => this.props.onAssetMetadataChanged(asset));
        for (const region of asset.regions) {
            this.editor.RM.updateTagsById(region.id, CanvasHelpers.getTagsDescriptor(region));
        }
    }

    private updateAssetRegions = (updates: IRegion[]) => {
        const updatedRegions = CanvasHelpers.updateRegions(this.state.currentAsset.regions, updates);
        const updatedSelectedRegions = CanvasHelpers.updateRegions(this.state.selectedRegions, updates);
        this.updateCanvasToolsRegions(updatedRegions);
        this.setAssetRegions(updatedRegions, updatedSelectedRegions);
    }

    private addRegionsToAsset = (regions: IRegion[]): void => {
        this.setAssetRegions(this.state.currentAsset.regions.concat(regions));
    }

    private getRegion(regions: IRegion[], id: string) {
        if (!regions || !id || regions.length === 0) {
            return null;
        }
        return regions.find((r) => r && r.id === id);
    }

    /**
     * Method that gets called when a new region is drawn
     * @param {RegionData} commit the RegionData of created region
     * @returns {void}
     */
    private onSelectionEnd = (commit: RegionData) => {
        const id = shortid.generate();

        this.editor.RM.addRegion(id, commit, null);

        // RegionData not serializable so need to extract data
        const scaledRegionData = this.editor.scaleRegionToSourceSize(commit);
        const newRegion = CanvasHelpers.getRegionFromRegionData(scaledRegionData, this.props.editorMode, id);
        const taggedRegion = CanvasHelpers.applyTagsToRegions([newRegion], this.props.lockedTags)[0];
        this.addRegionsToAsset([taggedRegion]);
        this.updateCanvasToolsRegions([taggedRegion]);
        this.setState({
            selectedRegions: [taggedRegion],
        });
    }

    /**
     * Method called when moving a region already in the editor
     * @param {string} id the id of the region that was moved
     * @param {RegionData} regionData the RegionData of moved region
     * @returns {void}
     */
    private onRegionMove = (id: string, regionData: RegionData) => {
        const movedRegion = CanvasHelpers.getRegion(this.state.currentAsset.regions, id);
        const scaledRegionData = this.editor.scaleRegionToSourceSize(regionData);
        if (movedRegion) {
            movedRegion.points = scaledRegionData.points;
        }
        this.updateAssetRegions([movedRegion]);
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @returns {void}
     */
    private onRegionDelete = (id: string) => {
        // Remove from Canvas Tools
        this.editor.RM.deleteRegionById(id);
        this.deleteRegionFromAsset(id);
        this.setState({
            selectedRegions: [],
        });
    }

    private setMultiSelect = (multiSelect: boolean) => {
        if (multiSelect !== this.state.multiSelect) {
            this.setState({ multiSelect });
        }
    }

    private copyRegions = () => {
        if (this.state.selectedRegions) {
            this.clipBoard.set(this.state.selectedRegions);
        }
    }

    private cutRegions = () => {
        this.copyRegions();
        const ids = this.state.selectedRegions.map((r) => r.id);
        for (const id of ids) {
            this.onRegionDelete(id);
        }
    }

    private pasteRegions = () => {
        const regions = this.clipBoard.get();
        if (regions) {
            const newRegions = CanvasHelpers.duplicateAndTransformRegions(regions, this.state.currentAsset.regions);
            this.addRegions(newRegions);
        }
    }

    private clearRegions = () => {
        const ids = this.state.currentAsset.regions.map((r) => r.id);
        for (const id of ids) {
            this.onRegionDelete(id);
        }
    }

    private deleteRegionFromAsset = (id: string): void => {
        this.setAssetRegions(this.state.currentAsset.regions.filter((r) => r.id !== id));
    }

    private addRegions = (regions: IRegion[]) => {
        for (const region of regions) {
            const regionData = CanvasHelpers.getRegionDataFromRegion(region);
            const scaledRegionData = this.editor.scaleRegionToFrameSize(regionData);
            this.editor.RM.addRegion(
                region.id,
                scaledRegionData,
                CanvasHelpers.getTagsDescriptor(region));
        }
        const newRegions = [
            ...this.state.currentAsset.regions,
            ...regions,
        ];
        this.addRegionsToAsset(regions);
    }

    private renderChildren = () => {
        return React.cloneElement(this.props.children, {
            onLoaded: this.onAssetLoaded,
            onActivated: this.onAssetActivated,
            onDeactivated: this.onAssetDeactivated,
        });
    }

    /**
     * Raised when the underlying asset has completed loading
     */
    private onAssetLoaded = async (contentSource: ContentSource) => {
        this.positionCanvas(contentSource);
        await this.setContentSource(contentSource);
        this.addCanvasToolsRegions(this.state.currentAsset.regions);
    }

    /**
     * Raised when the asset is taking control over the rendering
     */
    private onAssetActivated = (contentSource: ContentSource) => {
        this.clearAllRegions();
        this.setState({
            canvasEnabled: false,
        });
    }

    /**
     * Raise when the asset is handing off control of rendering
     */
    private onAssetDeactivated = async (contentSource: ContentSource) => {
        this.positionCanvas(contentSource);
        await this.setContentSource(contentSource);
        this.addCanvasToolsRegions(this.state.currentAsset.regions);

        this.setState({
            canvasEnabled: true,
        });
    }

    /**
     * Set the loaded asset content source into the canvas tools canvas
     */
    private setContentSource = async (contentSource: ContentSource) => {
        this.setState({ contentSource });
        try {
            await this.editor.addContentSource(contentSource);
        } catch (e) {
            console.warn(e);
        }
    }

    /**
     * Positions the canvas tools drawing surface to be exactly over the asset content
     */
    private positionCanvas = (contentSource: ContentSource) => {
        const canvas = this.canvasZone.current;
        canvas.style.top = `${contentSource.offsetTop}px`;
        canvas.style.left = `${contentSource.offsetLeft}px`;
        canvas.style.width = `${contentSource.offsetWidth}px`;
        canvas.style.height = `${contentSource.offsetHeight}px`;
    }

    private onWindowResize = () => {
        this.positionCanvas(this.state.contentSource);
    }

    /**
     * Updates the background of the canvas and draws the asset's regions
     */
    private clearAllRegions = () => {
        this.editor.RM.deleteAllRegions();
    }

    private updateCanvasToolsRegions = (regions: IRegion[]) => {
        if (CanvasHelpers.nullOrEmpty(regions)) {
            return;
        }
        for (const region of regions) {
            this.editor.RM.updateTagsById(region.id, CanvasHelpers.getTagsDescriptor(region));
        }
    }

    private addCanvasToolsRegions = (regions: IRegion[]) => {
        if (CanvasHelpers.nullOrEmpty(regions)) {
            return;
        }

        // Add regions to the canvas
        regions.forEach((region: IRegion) => {
            const loadedRegionData = CanvasHelpers.getRegionDataFromRegion(region);
            this.editor.RM.addRegion(
                region.id,
                this.editor.scaleRegionToFrameSize(loadedRegionData),
                CanvasHelpers.getTagsDescriptor(region));
        });

        // Set selected region to the last region
        this.setState({
            selectedRegions: [regions[regions.length - 1]],
        });
    }

    private selectAllRegions = () => {
        const regions = CanvasHelpers.applyTagsToRegions(this.state.currentAsset.regions, this.props.lockedTags);
        this.updateAssetRegions(regions);
        this.setState({ selectedRegions: regions });
    }

}
