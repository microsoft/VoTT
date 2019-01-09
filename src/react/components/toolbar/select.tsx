import { ToolbarItem } from "./toolbarItem";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { EditorMode } from "../../../models/applicationState";

export class Select extends ToolbarItem {
    protected onItemClick() {
        console.log("Select");
        this.props.canvas.setSelectionMode(SelectionMode.NONE);
        this.props.onEditorModeChange(EditorMode.Select);
    }
}
