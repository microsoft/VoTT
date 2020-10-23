import { ToolbarItemFactory } from "./providers/toolbar/toolbarItemFactory";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";
import { strings } from "./common/strings";

export enum ToolbarItemName {
    SelectCanvas = "selectCanvas",
    DrawRectangle = "drawRectangle",
    DrawPolygon = "drawPolygon",
    DrawPolyline = "drawPolyline",
    CopyRectangle = "copyRectangle",
    CopyRegions = "copyRegions",
    CutRegions = "cutRegions",
    PasteRegions = "pasteRegions",
    RemoveAllRegions = "removeAllRegions",
    PreviousAsset = "navigatePreviousAsset",
    NextAsset = "navigateNextAsset",
    SaveProject = "saveProject",
    ExportProject = "exportProject",
    ActiveLearning = "activeLearning",
    ShowSegBoundary = "showSegBoundary",
    AnnotateSegments = "annotateSegments",
    ExecuteSegmentation = "executeSegmentation",
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
        context: ["geometry", "segmentation"],
        tooltip: strings.editorPage.toolbar.select,
        icon: "fa-mouse-pointer",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["V", "v"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawRectangle,
        context: ["geometry"],
        tooltip: strings.editorPage.toolbar.drawRectangle,
        icon: "fa-vector-square",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["R", "r"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPolygon,
        context: ["geometry"],
        tooltip: strings.editorPage.toolbar.drawPolygon,
        icon: "fa-draw-polygon",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["P", "p"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPolyline,
        context: ["geometry"],
        tooltip: strings.editorPage.toolbar.drawPolyline,
        icon: "fa-draw-line",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["L", "l"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CopyRectangle,
        context: ["geometry"],
        tooltip: strings.editorPage.toolbar.copyRectangle,
        icon: "far fa-clone",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["CmdOrCtrl+W", "CmdOrCtrl+w"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CopyRegions,
        context: ["geometry"],
        tooltip: strings.editorPage.toolbar.copy,
        icon: "fa-copy",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+C", "CmdOrCtrl+c"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CutRegions,
        context: ["geometry"],
        tooltip: strings.editorPage.toolbar.cut,
        icon: "fa-cut",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+X", "CmdOrCtrl+x"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PasteRegions,
        context: ["geometry"],
        tooltip: strings.editorPage.toolbar.paste,
        icon: "fa-paste",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+V", "CmdOrCtrl+v"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.RemoveAllRegions,
        context: ["geometry"],
        tooltip: strings.editorPage.toolbar.removeAllRegions,
        icon: "fa-ban",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+Delete", "CmdOrCtrl+Backspace"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.AnnotateSegments,
        context: ["segmentation"],
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["A", "a"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.ShowSegBoundary,
        context: ["segmentation"],
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["B", "b"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.ExecuteSegmentation,
        context: ["segmentation"],
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["E", "e"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.ActiveLearning,
        context: ["geometry", "segmentation"],
        tooltip: strings.editorPage.toolbar.activeLearning,
        icon: "fas fa-graduation-cap",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+D", "CmdOrCtrl+d"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PreviousAsset,
        context: ["geometry", "segmentation"],
        tooltip: strings.editorPage.toolbar.previousAsset,
        icon: "fas fa-arrow-circle-up",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowUp", "W", "w"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.NextAsset,
        context: ["geometry", "segmentation"],
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowDown", "S", "s"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.SaveProject,
        context: ["geometry", "segmentation"],
        tooltip: strings.editorPage.toolbar.saveProject,
        icon: "fa-save",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+S", "CmdOrCtrl+s"],
    }, SaveProject);

    ToolbarItemFactory.register({
        name: ToolbarItemName.ExportProject,
        context: ["geometry", "segmentation"],
        tooltip: strings.editorPage.toolbar.exportProject,
        icon: "fa-external-link-square-alt",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+E", "CmdOrCtrl+e"],
    }, ExportProject);
}
