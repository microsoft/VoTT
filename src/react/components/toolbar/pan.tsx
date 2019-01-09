import { ToolbarItem } from "./toolbarItem";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { EditorMode } from "../../../models/applicationState";

export class Pan extends ToolbarItem {
    protected onItemClick() {
        this.props.canvas.setSelectionMode(SelectionMode.NONE);
        this.props.onEditorModeChange(EditorMode.None);
    }
}
