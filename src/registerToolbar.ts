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

export default function registerToolbar() {
    ToolbarItemFactory.register("selectCanvas", Select, {
        name: "selectCanvas",
        tooltip: "Select",
        icon: "fa-mouse-pointer",
        group: "canvas",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register("panCanvas", Pan, {
        name: "panCanvas",
        tooltip: "Pan",
        icon: "fa-arrows-alt",
        group: "canvas",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register("drawRectangle", DrawRectangle, {
        name: "drawRectangle",
        tooltip: "Draw Rectangle",
        icon: "fa-vector-square",
        group: "canvas",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register("drawPolygon", DrawPolygon, {
        name: "drawPolygon",
        tooltip: "Draw Polygon",
        icon: "fa-draw-polygon",
        group: "canvas",
        type: ToolbarItemType.State,
    });

    ToolbarItemFactory.register("zoomInCanvas", ZoomIn, {
        name: "zoomInCanvas",
        tooltip: "Zoom In",
        icon: "fa-search-plus",
        group: "zoom",
        type: ToolbarItemType.Action,
    });

    ToolbarItemFactory.register("zoomOutCanvas", ZoomOut, {
        name: "zoomOutCanvas",
        tooltip: "Zoom Out",
        icon: "fa-search-minus",
        group: "zoom",
        type: ToolbarItemType.Action,
    });

    ToolbarItemFactory.register("saveProject", SaveProject, {
        name: "saveProject",
        tooltip: "Save Project",
        icon: "fa-save",
        group: "project",
        type: ToolbarItemType.Action,
    });

    ToolbarItemFactory.register("exportProject", ExportProject, {
        name: "exportProject",
        tooltip: "Export Project",
        icon: "fa-external-link-square-alt",
        group: "project",
        type: ToolbarItemType.Action,
    });
}
