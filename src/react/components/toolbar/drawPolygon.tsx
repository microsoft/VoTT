import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Draw Polygon
 * @description - Toolbar item to change draw mode to polygon
 */
export class DrawPolygon extends ToolbarItem {
    protected onItemClick() {
        console.log("Draw Polygon");
        this.props.onClick(this);
    }
}
