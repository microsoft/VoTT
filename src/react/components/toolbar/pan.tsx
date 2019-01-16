import { ToolbarItem } from "./toolbarItem";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { EditorMode } from "../../../models/applicationState";

/**
 * @name - Pan
 * @description - Toolbar item to change tool tip mode to pan
 */
export class Pan extends ToolbarItem {
    protected onItemClick() {
        this.props.canvas.setSelectionMode(SelectionMode.NONE);
        this.props.onEditorModeChange(EditorMode.None);
    }
}
