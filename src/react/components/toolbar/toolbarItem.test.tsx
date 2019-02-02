import React from "react";
import { ToolbarItem, IToolbarItemProps, ToolbarItemType } from "./toolbarItem";
import { mount, ReactWrapper } from "enzyme";
import MockFactory from "../../../common/mockFactory";
import { KeyboardBinding } from "../common/keyboardBinding/keyboardBinding";
import { KeyboardManager } from "../common/keyboardManager/keyboardManager";

describe("Toolbar Item", () => {
    let onClickHandler = jest.fn();

    function createComponent(props?: IToolbarItemProps): ReactWrapper {
        props = props || createProps();
        return mount(
            <KeyboardManager>
                <TestToolbarItem {...props} />
            </KeyboardManager>,
        );
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
        };
    }

    beforeEach(() => onClickHandler = jest.fn());

    it("Renders as a button by default", () => {
        const wrapper = createComponent();
        const button = wrapper.find("button");
        expect(button.exists()).toBe(true);
        expect(button.prop("className")).toEqual("toolbar-btn");
        expect(wrapper.find(KeyboardBinding).exists()).toBe(false);
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

    it("Renders a keyboard binding when an accelerator is configured", () => {
        const props = createProps();
        props.accelerator = "Ctrl+1";

        const wrapper = createComponent(props);
        expect(wrapper.find(KeyboardBinding).exists()).toBe(true);
    });
});

class TestToolbarItem extends ToolbarItem {
    protected onItemClick() {
        return;
    }
}
