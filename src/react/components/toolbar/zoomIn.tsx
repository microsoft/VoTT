import { ToolbarItem } from "./toolbarItem";

export class ZoomIn extends ToolbarItem {
    protected onItemClick() {
        console.log("Zoom In");
    }
}
