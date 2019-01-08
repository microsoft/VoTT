import { ToolbarItem } from "./toolbarItem";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";

export class DrawRectangle extends ToolbarItem {
    protected onItemClick() {
        console.log("Draw Rectangle");
        this.props.canvas.setSelectionMode(SelectionMode.RECT);
    }
}
