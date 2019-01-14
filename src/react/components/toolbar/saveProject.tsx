import { ToolbarItem } from "./toolbarItem";
import { toast } from "react-toastify";

export class SaveProject extends ToolbarItem {
    protected async onItemClick() {
        try {
            await this.props.actions.saveProject(this.props.project);
            toast.success(`${this.props.project.name} saved successfully!`);
        } catch (e) {
            toast.error(`Error saving ${this.props.project.name}`);
        }
    }
}
