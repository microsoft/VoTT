import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Zoom In
 * @description - Toolbar item to zoom in on current image
 */
export class ZoomIn extends ToolbarItem {
    protected onItemClick() {
        console.log("Zoom In");
    }
}
