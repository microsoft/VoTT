import React from "react";
import { AutoSizer, List } from "react-virtualized";
import { IAsset, AssetState, IAssetVideoSettings } from "../../../../models/applicationState";
import AssetPreview from "./assetPreview";

/**
 * Properties for Editor Side Bar
 * @member assets - Array of assets to be previewed
 * @member onAssetSelected - Function to call when asset from side bar is selected
 * @member selectedAsset - Asset initially selected
 */
export interface IEditorSideBarProps {
    assets: IAsset[];
    onAssetSelected: (asset: IAsset) => void;
    selectedAsset?: IAsset;
}

/**
 * State for Editor Side Bar
 * @member selectedAsset - Asset selected from side bar
 */
export interface IEditorSideBarState {
    selectedAsset: IAsset;
}

/**
 * @name - Editor Side Bar
 * @description - Side bar for editor page
 */
export default class EditorSideBar extends React.Component<IEditorSideBarProps, IEditorSideBarState> {
    private listRef: React.RefObject<List>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            selectedAsset: this.props.selectedAsset,
        };

        this.rowRenderer = this.rowRenderer.bind(this);
        this.onAssetClicked = this.onAssetClicked.bind(this);
        this.listRef = React.createRef<List>();
    }

    public render() {
        return (
            <div className="editor-page-sidebar-nav">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            ref={this.listRef}
                            className="asset-list"
                            height={height}
                            width={width}
                            rowCount={this.props.assets.length}
                            rowHeight={233}
                            rowRenderer={this.rowRenderer}
                            overscanRowCount={2}
                        />
                    )}
                </AutoSizer>
            </div>
        );
    }

    public componentDidUpdate(prevProps: IEditorSideBarProps) {
        if (!prevProps.selectedAsset && !this.props.selectedAsset) {
            return;
        }

        if ((!prevProps.selectedAsset && this.props.selectedAsset) ||
            prevProps.selectedAsset.id !== this.props.selectedAsset.id) {
            this.selectAsset(this.props.selectedAsset);
        }
    }

    private selectAsset(asset: IAsset) {
        this.setState({
            selectedAsset: asset,
        }, () => {
            this.listRef.current.forceUpdateGrid();
        });
    }

    private onAssetClicked(asset: IAsset) {
        this.selectAsset(asset);
        this.props.onAssetSelected(asset);
    }

    private rowRenderer({ key, index, style }) {
        const asset = this.props.assets[index];
        const { selectedAsset } = this.state;
        const editorVideoSetting: IAssetVideoSettings = {
            shouldAutoPlayVideo: false,
            posterSource: null,
            shouldShowPlayControls: false,
        };

        return (
            <div key={key} style={style}
                className={this.getAssetCssClassNames(asset, selectedAsset)}
                onClick={() => this.onAssetClicked(asset)}>
                <div className="asset-item-image">
                    <AssetPreview asset={asset} videoSettings={editorVideoSetting} />
                </div>
                <div className="asset-item-metadata">
                    <span className="asset-filename" title={asset.name}>{asset.name}</span>
                    {asset.size &&
                        <span className="float-right">
                            {asset.size.width} x {asset.size.height}
                        </span>
                    }
                </div>
            </div>
        );
    }

    private getAssetCssClassNames(asset: IAsset, selectedAsset: IAsset = null): string {
        const cssClasses = ["asset-item"];
        if (selectedAsset && selectedAsset.id === asset.id) {
            cssClasses.push("selected");
        }

        switch (asset.state) {
            case AssetState.NotVisited:
                cssClasses.push("not-visited");
                break;
            case AssetState.Visited:
                cssClasses.push("visited");
                break;
            case AssetState.Tagged:
                cssClasses.push("tagged");
                break;
        }

        return cssClasses.join(" ");
    }
}
