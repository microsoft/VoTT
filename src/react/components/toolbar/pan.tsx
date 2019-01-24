import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Pan
 * @description - Toolbar item to change tool tip mode to pan
 */
export class Pan extends ToolbarItem {
    protected onItemClick() {
        this.props.onClick(this);
    }
}
