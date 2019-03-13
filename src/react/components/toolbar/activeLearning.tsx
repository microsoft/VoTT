import { ToolbarItem } from "./toolbarItem";

/**
 * @name - ActiveLearning
 * @description - Toolbar item to auto draw rectangles
 */
export class ActiveLearning extends ToolbarItem {
    protected onItemClick() {
        this.props.onClick(this);
    }
}
