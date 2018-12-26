import { ToolbarItem } from "./toolbarItem";

export class Select extends ToolbarItem {
    protected onItemClick() {
        console.log("Select");
    }
}
