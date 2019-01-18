import { ToolbarItem } from "./toolbarItem";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { EditorMode } from "../../../models/applicationState";

/**
 * @name - Draw Rectangle
 * @description - Toolbar item to change draw mode to rectangle
 */
export class DrawRectangle extends ToolbarItem {
    protected onItemClick() {
        console.log("Draw Rectangle");
        this.props.onClick(this);
    }
}
