import { ToolbarItemFactory } from "./providers/toolbar/toolbarItemFactory";
import { ClearRegions } from "./react/components/toolbar/clearRegions";
import { CopyRegions } from "./react/components/toolbar/copyRegions";
import { CutRegions } from "./react/components/toolbar/cutRegions";
import { DrawPolygon } from "./react/components/toolbar/drawPolygon";
import { DrawRectangle } from "./react/components/toolbar/drawRectangle";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { NextAsset } from "./react/components/toolbar/nextAsset";
import { Pan } from "./react/components/toolbar/pan";
import { PasteRegions } from "./react/components/toolbar/pasteRegions";
import { PreviousAsset } from "./react/components/toolbar/previousAsset";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { Select } from "./react/components/toolbar/select";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";
import { ZoomIn } from "./react/components/toolbar/zoomIn";
import { ZoomOut } from "./react/components/toolbar/zoomOut";

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

    ToolbarItemFactory.register(Pan, {
        name: "panCanvas",
        tooltip: "Pan",
        icon: "fa-arrows-alt",
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

    ToolbarItemFactory.register(CopyRegions, {
        name: "copyRegions",
        tooltip: "Copy Regions",
        icon: "fa-clone",
        group: "regions",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register(CutRegions, {
        name: "cutRegions",
        tooltip: "Cut Regions",
        icon: "fa-cut",
        group: "regions",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register(PasteRegions, {
        name: "pasteRegions",
        tooltip: "Paste Regions",
        icon: "fa-paste",
        group: "regions",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register(ClearRegions, {
        name: "clearRegions",
        tooltip: "Clear Regions",
        icon: "fa-ban",
        group: "regions",
        type: ToolbarItemType.Action,
    });

    ToolbarItemFactory.register(ZoomIn, {
        name: "zoomInCanvas",
        tooltip: "Zoom In",
        icon: "fa-search-plus",
        group: "zoom",
        type: ToolbarItemType.Action,
    });

    ToolbarItemFactory.register(ZoomOut, {
        name: "zoomOutCanvas",
        tooltip: "Zoom Out",
        icon: "fa-search-minus",
        group: "zoom",
        type: ToolbarItemType.Action,
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
