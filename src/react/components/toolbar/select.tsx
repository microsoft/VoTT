import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Select
 * @description - Toolbar item to change tool tip mode to select
 */
export class Select extends ToolbarItem {
    protected onItemClick() {
        console.log("Select");
        this.props.onClick(this);
    }
}
