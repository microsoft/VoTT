import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Cut Rectangle
 * @description - Toolbar item to change draw mode to cut rectangle
 */
export class CutRegions extends ToolbarItem {
    protected onItemClick() {
        console.log("Cut Rectangle");
        this.props.onClick(this);
    }
} 