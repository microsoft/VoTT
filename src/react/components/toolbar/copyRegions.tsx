import { ToolbarItem } from "./toolbarItem";

/**
 * @name - Copy Regions
 * @description - Toolbar item to change draw mode to copy rectangle
 */
export class CopyRegions extends ToolbarItem {
    protected onItemClick() {
        console.log("Copy Rectangle");
        this.props.onClick(this);
    }
}
