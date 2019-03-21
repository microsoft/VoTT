import { ToolbarItemFactory } from "./providers/toolbar/toolbarItemFactory";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";
import { strings } from "./common/strings";

export enum ToolbarItemName {
    SelectCanvas = "selectCanvas",
    DrawRectangle = "drawRectangle",
    DrawPolygon = "drawPolygon",
    CopyRectangle = "copyRectangle",
    CopyRegions = "copyRegions",
    CutRegions = "cutRegions",
    PasteRegions = "pasteRegions",
    RemoveAllRegions = "removeAllRegions",
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
        tooltip: strings.editorPage.toolbar.select,
        icon: "fa-mouse-pointer",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["V", "v"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawRectangle,
        tooltip: strings.editorPage.toolbar.drawRectangle,
        icon: "fa-vector-square",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["R", "r"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPolygon,
        tooltip: strings.editorPage.toolbar.drawPolygon,
        icon: "fa-draw-polygon",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["P", "p"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CopyRectangle,
        tooltip: strings.editorPage.toolbar.copyRectangle,
        icon: "far fa-clone",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["Ctrl+W", "Ctrl+w"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CopyRectangle,
        tooltip: strings.editorPage.toolbar.copyRectangle,
        icon: "far fa-clone",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["Ctrl+w", "Ctrl+W"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CopyRegions,
        tooltip: strings.editorPage.toolbar.copy,
        icon: "fa-copy",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+C", "Ctrl+c"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CutRegions,
        tooltip: strings.editorPage.toolbar.cut,
        icon: "fa-cut",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+X", "Ctrl+x"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PasteRegions,
        tooltip: strings.editorPage.toolbar.paste,
        icon: "fa-paste",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+V", "Ctrl+v"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.RemoveAllRegions,
        tooltip: strings.editorPage.toolbar.removeAllRegions,
        icon: "fa-ban",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+Delete"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PreviousAsset,
        tooltip: strings.editorPage.toolbar.previousAsset,
        icon: "fas fa-arrow-circle-up",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowUp", "W", "w"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.NextAsset,
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowDown", "S", "s"],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.SaveProject,
        tooltip: strings.editorPage.toolbar.saveProject,
        icon: "fa-save",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+S", "Ctrl+s"],
    }, SaveProject);

    ToolbarItemFactory.register({
        name: ToolbarItemName.ExportProject,
        tooltip: strings.editorPage.toolbar.exportProject,
        icon: "fa-external-link-square-alt",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
        accelerators: ["Ctrl+E", "Ctrl+e"],
    }, ExportProject);
}
