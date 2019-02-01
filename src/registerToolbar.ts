import { ToolbarItemFactory } from "./providers/toolbar/toolbarItemFactory";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { Select } from "./react/components/toolbar/select";
import { DrawRectangle } from "./react/components/toolbar/drawRectangle";
import { DrawPolygon } from "./react/components/toolbar/drawPolygon";
import { Pan } from "./react/components/toolbar/pan";
import { ZoomIn } from "./react/components/toolbar/zoomIn";
import { ZoomOut } from "./react/components/toolbar/zoomOut";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";
import { CopyRectangle } from "./react/components/toolbar/copyRectangle";
import { NextAsset } from "./react/components/toolbar/nextAsset";
import { PreviousAsset } from "./react/components/toolbar/previousAsset";
import { StepBwd } from "./react/components/toolbar/stepBwd";
import { StepFwd } from "./react/components/toolbar/stepFwd";

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

    ToolbarItemFactory.register(CopyRectangle, {
        name: "copyRectangle",
        tooltip: "Copy Rectangle",
        icon: "fa-clone",
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
        icon: "fas fa-arrow-circle-left",
        group: "navigation",
        type: ToolbarItemType.Action,
        accelerator: "ArrowLeft",
    });

    ToolbarItemFactory.register(NextAsset, {
        name: "navigateNextAsset",
        tooltip: "Next Asset",
        icon: "fas fa-arrow-circle-right",
        group: "navigation",
        type: ToolbarItemType.Action,
        accelerator: "ArrowRight",
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

    ToolbarItemFactory.register(StepBwd, {
        name: "stepBwd",
        tooltip: "Step Bwd",
        icon: "fa-step-backward",
        group: "nav",
        type: ToolbarItemType.Action,
    });

    ToolbarItemFactory.register(StepFwd, {
        name: "stepFwd",
        tooltip: "Step Fwd",
        icon: "fa-step-forward",
        group: "nav",
        type: ToolbarItemType.Action,
    });
}
