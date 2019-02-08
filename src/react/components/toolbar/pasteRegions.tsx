import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Paste Rectangle
 * @description - Toolbar item to change draw mode to paste rectangle
 */
export class PasteRegions extends ToolbarItem {
    protected onItemClick() {
        console.log("Paste Rectangle");
        this.props.onClick(this);
    }
}
