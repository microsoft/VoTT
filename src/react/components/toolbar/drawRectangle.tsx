import { ToolbarItem } from "./toolbarItem";

export class DrawRectangle extends ToolbarItem {
    protected onItemClick() {
        console.log("Draw Rectangle");
    }
}
