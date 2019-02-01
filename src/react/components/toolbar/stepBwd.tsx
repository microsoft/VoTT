import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Step Bwd
 * @description - Toolbar item to zoom in on current image
 */
export class StepBwd extends ToolbarItem {
    protected onItemClick() {
        console.log("Step Bwd");
    }
}
