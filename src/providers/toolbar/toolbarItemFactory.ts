import _ from "lodash";
import { IToolbarItemMetadata, ToolbarItem } from "../../react/components/toolbar/toolbarItem";
import Guard from "../../common/guard";

/**
 * Interface for registering toolbar items
 */
export interface IToolbarItemRegistration {
    component: typeof ToolbarItem;
    config: IToolbarItemMetadata;
}

/**
 * @name - Toolbar Item Factory
 * @description - Creates instance of Toolbar Items based on specified options
 */
export class ToolbarItemFactory {
    /**
     * Register Toolbar Item for use in editor page
     * @param component - React component ToolbarItem
     * @param config - Configuration of ToolbarItem
     */
    public static register(config: IToolbarItemMetadata, component: typeof ToolbarItem = ToolbarItem) {
        Guard.null(component);
        Guard.null(config);

        ToolbarItemFactory.componentRegistry.push({ component, config });
    }

    /**
     * Get all registered Toolbar Items
     */
    public static getToolbarItems() {
        return [...ToolbarItemFactory.componentRegistry];
    }

    /**
     * Clear ToolbarItem Registry
     */
    public static reset(): void {
        ToolbarItemFactory.componentRegistry = [];
    }

    private static componentRegistry: IToolbarItemRegistration[] = [];
}
