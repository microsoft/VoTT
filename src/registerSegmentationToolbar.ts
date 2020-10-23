import { ToolbarItemFactory4Segmentation } from "./providers/toolbar/toolbarItemFactory4Segmentation";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";
import { strings } from "./common/strings";
import { ToolbarItemName } from "./registerToolbar";
import { ToolbarItemGroup } from "./registerToolbar";

/**
 * Registers items for toolbar
 */
export default function registerSegmentationToolbar() {
    ToolbarItemFactory4Segmentation.register({
        name: ToolbarItemName.SelectCanvas,
        tooltip: strings.editorPage.toolbar.select,
        icon: "fa-mouse-pointer",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["N", "n"],
    });

    ToolbarItemFactory4Segmentation.register({
        name: ToolbarItemName.AnnotateSegments,
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["A", "a"],
    });

    ToolbarItemFactory4Segmentation.register({
        name: ToolbarItemName.ShowSegBoundary,
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["B", "b"],
    });

    ToolbarItemFactory4Segmentation.register({
        name: ToolbarItemName.ExecuteSegmentation,
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["E", "e"],
    });
}
