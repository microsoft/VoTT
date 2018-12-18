import { ToolbarItem } from "./toolbarItem";

export class ExportProject extends ToolbarItem {
    protected onItemClick() {
        this.props.actions.exportProject(this.props.project);
    }
}
