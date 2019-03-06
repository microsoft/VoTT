import { ToolbarItemFactory } from "./providers/toolbar/toolbarItemFactory";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";

export enum ToolbarItemName {
    SelectCanvas = "selectCanvas",
    DrawRectangle = "drawRectangle",
    DrawPolygon = "drawPolygon",
    CopyRectangle = "copyRectangle",
    CopyRegions = "copyRegions",
    CutRegions = "cutRegions",
    PasteRegions = "pasteRegions",
    ClearRegions = "clearRegions",
    PreviousAsset = "navigatePreviousAsset",
    NextAsset = "navigateNextAsset",
    SaveProject = "saveProject",
    ExportProject = "exportProject",
}

export enum ToolbarItemGroup {
    Canvas = "canvas",
    Regions = "regions",
    Navigation = "navigation",
    Project = "project",
}

/**
 * Registers items for toolbar
 */
export default function registerToolbar() {
    ToolbarItemFactory.register({
        name: ToolbarItemName.SelectCanvas,
        tooltip: "Select (V)",
        icon: "fa-mouse-pointer",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["v", "V"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawRectangle,
        tooltip: "Draw Rectangle (R)",
        icon: "fa-vector-square",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["r", "R"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPolygon,
        tooltip: "Draw Polygon (P)",
        icon: "fa-draw-polygon",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["p", "P"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CopyRegions,
        tooltip: "Copy Regions",
        icon: "fa-copy",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+c"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CutRegions,
        tooltip: "Cut Regions",
        icon: "fa-cut",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+x"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PasteRegions,
        tooltip: "Paste Regions",
        icon: "fa-paste",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+v"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.ClearRegions,
        tooltip: "Clear Regions",
        icon: "fa-trash-alt",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+Delete"]
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PreviousAsset,
        tooltip: "Previous Asset (W)",
        icon: "fas fa-arrow-circle-up",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowUp", "w", "W"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.NextAsset,
        tooltip: "Next Asset (S)",
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowDown", "s", "S"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.SaveProject,
        tooltip: "Save Project (Ctrl+S)",
        icon: "fa-save",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
    }, SaveProject);

    ToolbarItemFactory.register({
        name: ToolbarItemName.ExportProject,
        tooltip: "Export Project (Ctrl+E)",
        icon: "fa-external-link-square-alt",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+e", "Ctrl+E"],
    }, ExportProject);
}
