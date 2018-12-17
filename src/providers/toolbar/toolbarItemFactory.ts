import _ from "lodash";
import { IToolbarItemMetadata, ToolbarItem } from "../../react/components/toolbar/toolbarItem";
import Guard from "../../common/guard";

export interface IToolbarItemRegistration {
    component: typeof ToolbarItem;
    config: IToolbarItemMetadata;
}

export class ToolbarItemFactory {
    public static register(component: typeof ToolbarItem, config: IToolbarItemMetadata) {
        Guard.null(component);
        Guard.null(config);

        ToolbarItemFactory.componentRegistry.push({ component, config });
    }

    public static getToolbarItems() {
        return [...ToolbarItemFactory.componentRegistry];
    }

    public static reset(): void {
        ToolbarItemFactory.componentRegistry = [];
    }

    private static componentRegistry: IToolbarItemRegistration[] = [];
}
