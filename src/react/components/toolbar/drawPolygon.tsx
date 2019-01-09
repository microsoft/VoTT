import { ToolbarItem } from "./toolbarItem";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { EditorMode } from "../../../models/applicationState";

export class DrawPolygon extends ToolbarItem {
    protected onItemClick() {
        console.log("Draw Polygon");
        this.props.canvas.setSelectionMode(SelectionMode.POLYGON);
        this.props.onEditorModeChange(EditorMode.Polygon);
    }
}
