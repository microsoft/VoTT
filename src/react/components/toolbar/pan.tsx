import { ToolbarItem } from "./toolbarItem";

export class Pan extends ToolbarItem {
    protected onItemClick() {
        console.log("Pan");
    }
}
