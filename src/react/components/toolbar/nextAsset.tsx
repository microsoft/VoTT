import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Next Asset
 * @description - Toolbar item to navigate to next asset
 */
export class NextAsset extends ToolbarItem {
    protected onItemClick() {
        this.props.onClick(this);
    }
}
