import React from "react";
import { ToolbarItem, IToolbarItemProps, ToolbarItemType } from "./toolbarItem";
import { mount, ReactWrapper } from "enzyme";
import MockFactory from "../../../common/mockFactory";
import Canvas from "../pages/editorPage/canvas";

describe("Toolbar Item", () => {
    let onClickHandler = jest.fn();

    function createComponent(props?: IToolbarItemProps): ReactWrapper {
        props = props || createProps();
        return mount(<TestToolbarItem {...props} />);
    }

    function createProps(): IToolbarItemProps {
        return {
            actions: MockFactory.projectActions(),
            project: MockFactory.createTestProject("TestProject"),
            active: false,
            group: "test-groups",
            icon: "fa-test",
            name: "Test Item",
            tooltip: "Test Item Tooltip",
            onClick: onClickHandler,
            type: ToolbarItemType.Action,
            canvas: MockFactory.createTestCanvas(),
            onEditorModeChange: () => null,
        };
    }

    beforeEach(() => onClickHandler = jest.fn());

    it("Renders as a button by default", () => {
        const wrapper = createComponent();
        const button = wrapper.find("button");
        expect(button.exists()).toBe(true);
        expect(button.prop("className")).toEqual("toolbar-btn");
    });

    it("Calls click handler when selected", () => {
        const wrapper = createComponent();
        wrapper.find("button").first().simulate("click");
        expect(onClickHandler).toBeCalled();
    });

    it("Renders with an active class when set to active", () => {
        const props = createProps();
        props.active = true;
        const wrapper = createComponent(props);

        const button = wrapper.find("button");
        expect(button.prop("className")).toEqual("toolbar-btn active");
    });
});

class TestToolbarItem extends ToolbarItem {
    protected onItemClick() {
        return;
    }
}
