import { ToolbarItem } from "./toolbarItem";
import { toast } from "react-toastify";

export class ExportProject extends ToolbarItem {
    protected async onItemClick() {
        const infoId = toast.info(`Started export for ${this.props.project.name}...`, { autoClose: false });
        const results = await this.props.actions.exportProject(this.props.project);

        toast.dismiss(infoId);

        if (!results || (results && results.errors.length === 0)) {
            toast.success(`Export completed successfully!`);
        } else if (results && results.errors.length > 0) {
            toast.warn(`Successfully exported ${results.completed.length}/${results.count} assets`);
        }
    }
}
