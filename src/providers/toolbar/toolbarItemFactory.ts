import _ from "lodash";
import { IToolbarItemMetadata, ToolbarItem } from "../../react/components/toolbar/toolbarItem";
import Guard from "../../common/guard";

export interface IComponentRegistration {
    key: string;
    component: typeof ToolbarItem;
    config: IToolbarItemMetadata;
}

export class ToolbarItemFactory {
    public static register(key: string, component: typeof ToolbarItem, config: IToolbarItemMetadata) {
        Guard.emtpy(key);
        Guard.null(component);
        Guard.null(config);

        ToolbarItemFactory.componentRegistry.push({ key, component, config });
    }

    public static getToolbarItems() {
        return [...ToolbarItemFactory.componentRegistry];
    }

    private static componentRegistry: IComponentRegistration[] = [];
}
