import { ToolbarItemFactory } from "./toolbarItemFactory";
import { IToolbarItemMetadata, ToolbarItemType, ToolbarItem } from "../../react/components/toolbar/toolbarItem";
import registerToolbar, { ToolbarItemName, ToolbarItemGroup } from "../../registerToolbar";

class TestToolbarItem extends ToolbarItem {
    protected onItemClick() {
        throw new Error("Method not implemented.");
    }
}

describe("Toolbar Item Factory", () => {
    const testToolbarItemConfig: IToolbarItemMetadata = {
        name: ToolbarItemName.SelectCanvas,
        group: ToolbarItemGroup.Canvas,
        icon: "fa-test",
        tooltip: "Test Component",
        type: ToolbarItemType.Action,
    };

    it("Register add a new component registration to the registry", () => {
        const existingItems = ToolbarItemFactory.getToolbarItems();
        expect(existingItems.length).toEqual(0);

        ToolbarItemFactory.register(testToolbarItemConfig, TestToolbarItem);
        const newItems = ToolbarItemFactory.getToolbarItems();
        expect(newItems.length).toEqual(1);
        expect(newItems[0].config).toEqual(testToolbarItemConfig);
        expect(newItems[0].component).toEqual(TestToolbarItem);
    });

    it("Registering a toolbar item with invalid values throws an exception", () => {
        expect(() => ToolbarItemFactory.register(null, null)).toThrowError();
        expect(() => ToolbarItemFactory.register(null, TestToolbarItem)).toThrowError();
        expect(() => ToolbarItemFactory.register(testToolbarItemConfig, null)).toThrowError();
    });

    it("Calling 'getToolbarItems' returns a copy of the component registry", () => {
        ToolbarItemFactory.reset();

        const itemsResult1 = ToolbarItemFactory.getToolbarItems();
        registerToolbar();
        const itemsResult2 = ToolbarItemFactory.getToolbarItems();
        const itemsResult3 = ToolbarItemFactory.getToolbarItems();

        expect(itemsResult1.length).toEqual(0);
        expect(itemsResult2.length).toBeGreaterThan(0);
        expect(itemsResult2.length).toEqual(itemsResult3.length);
        expect(itemsResult2).toEqual(itemsResult3);
        expect(itemsResult2).not.toBe(itemsResult3);
    });
});
