import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Zoom Out
 * @description - Toolbar item to zoom out on current image
 */
export class ZoomOut extends ToolbarItem {
    protected onItemClick() {
        console.log("Zoom Out");
    }
}
