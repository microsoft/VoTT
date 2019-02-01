import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Step Fwd
 * @description - Toolbar item to zoom in on current image
 */
export class StepFwd extends ToolbarItem {
    protected onItemClick() {
        console.log("Step Fwd");
    }
}
