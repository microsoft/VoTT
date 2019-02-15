import { ToolbarItemFactory } from "./providers/toolbar/toolbarItemFactory";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { Select } from "./react/components/toolbar/select";
import { DrawRectangle } from "./react/components/toolbar/drawRectangle";
import { DrawPolygon } from "./react/components/toolbar/drawPolygon";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";
import { CopyRectangle } from "./react/components/toolbar/copyRectangle";
import { NextAsset } from "./react/components/toolbar/nextAsset";
import { PreviousAsset } from "./react/components/toolbar/previousAsset";

/**
 * Registers items for toolbar
 */
export default function registerToolbar() {
    ToolbarItemFactory.register(Select, {
        name: "selectCanvas",
        tooltip: "Select",
        icon: "fa-mouse-pointer",
        group: "canvas",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register(DrawRectangle, {
        name: "drawRectangle",
        tooltip: "Draw Rectangle",
        icon: "fa-vector-square",
        group: "canvas",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register(DrawPolygon, {
        name: "drawPolygon",
        tooltip: "Draw Polygon",
        icon: "fa-draw-polygon",
        group: "canvas",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register(PreviousAsset, {
        name: "navigatePreviousAsset",
        tooltip: "Previous Asset",
        icon: "fas fa-arrow-circle-up",
        group: "navigation",
        type: ToolbarItemType.Action,
        accelerators: ["ArrowUp", "w", "W"],
    });

    ToolbarItemFactory.register(NextAsset, {
        name: "navigateNextAsset",
        tooltip: "Next Asset",
        icon: "fas fa-arrow-circle-down",
        group: "navigation",
        type: ToolbarItemType.Action,
        accelerators: ["ArrowDown", "s", "S"],
    });

    ToolbarItemFactory.register(SaveProject, {
        name: "saveProject",
        tooltip: "Save Project",
        icon: "fa-save",
        group: "project",
        type: ToolbarItemType.Action,
    });

    ToolbarItemFactory.register(ExportProject, {
        name: "exportProject",
        tooltip: "Export Project",
        icon: "fa-external-link-square-alt",
        group: "project",
        type: ToolbarItemType.Action,
    });
}
