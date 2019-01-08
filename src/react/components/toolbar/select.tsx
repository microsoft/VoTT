import { ToolbarItem } from "./toolbarItem";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";

export class Select extends ToolbarItem {
    protected onItemClick() {
        console.log("Select");
        this.props.canvas.setSelectionMode(SelectionMode.NONE);
    }
}
