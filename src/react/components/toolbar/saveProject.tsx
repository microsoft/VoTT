import { ToolbarItem } from "./toolbarItem";

export class SaveProject extends ToolbarItem {
    protected onItemClick() {
        this.props.actions.saveProject(this.props.project);
    }
}
