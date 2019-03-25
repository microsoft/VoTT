import React from "react";
import { AutoSizer, List } from "react-virtualized";
import { IAsset, AssetState } from "../../../../models/applicationState";
import { AssetPreview } from "../../common/assetPreview/assetPreview";

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
    scrollToIndex: number;
}

/**
 * @name - Editor Side Bar
 * @description - Side bar for editor page
 */
export default class EditorSideBar extends React.Component<IEditorSideBarProps, IEditorSideBarState> {
    private listRef: React.RefObject<List>;

    constructor(props, context) {
        super(props, context);

        const selectedAsset = this.props.selectedAsset;
        const scrollToIndex = selectedAsset
            ? this.props.assets.findIndex((asset) => asset.id === selectedAsset.id)
            : 0;

        this.state = {
            scrollToIndex,
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
                            rowHeight={155}
                            rowRenderer={this.rowRenderer}
                            overscanRowCount={2}
                            scrollToIndex={this.state.scrollToIndex}
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

    private selectAsset(selectedAsset: IAsset) {
        const scrollToIndex = this.props.assets.findIndex((asset) => asset.id === selectedAsset.id);

        this.setState({
            scrollToIndex,
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
        const selectedAsset = this.props.selectedAsset;

        return (
            <div key={key} style={style}
                className={this.getAssetCssClassNames(asset, selectedAsset)}
                onClick={() => this.onAssetClicked(asset)}>
                <div className="asset-item-image">
                    {this.renderBadges(asset)}
                    <AssetPreview asset={asset} />
                </div>
                <div className="asset-item-metadata">
                    <span className="asset-filename" title={asset.name}>{asset.name}</span>
                    {asset.size &&
                        <span>
                            {asset.size.width} x {asset.size.height}
                        </span>
                    }
                </div>
            </div>
        );
    }

    private renderBadges(asset: IAsset) {
        switch (asset.state) {
            case AssetState.Tagged:
                return (<span title="Tagged" className="badge badge-tagged"><i className="fas fa-tag"></i></span>);
            case AssetState.Visited:
                return (<span title="Visited" className="badge badge-visited"><i className="fas fa-eye"></i></span>);
            default:
                return null;
        }
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
