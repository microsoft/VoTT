import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Previous Asset
 * @description - Toolbar item to navigate to previous
 */
export class PreviousAsset extends ToolbarItem {
    protected onItemClick() {
        this.props.onClick(this);
    }
}
