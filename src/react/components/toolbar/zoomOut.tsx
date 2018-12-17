import { ToolbarItem } from "./toolbarItem";

export class ZoomOut extends ToolbarItem {
    protected onItemClick() {
        console.log("Zoom Out");
    }
}
