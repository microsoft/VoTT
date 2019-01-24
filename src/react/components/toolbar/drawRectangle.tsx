import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Draw Rectangle
 * @description - Toolbar item to change draw mode to rectangle
 */
export class DrawRectangle extends ToolbarItem {
    protected onItemClick() {
        console.log("Draw Rectangle");
        this.props.onClick(this);
    }
}
