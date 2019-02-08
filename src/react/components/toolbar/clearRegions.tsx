import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Clear Regions
 * @description - Toolbar item to clear regions from asset
 */
export class ClearRegions extends ToolbarItem {
    protected onItemClick() {
        console.log("Clear Regions");
        this.props.onClick(this);
    }
} 