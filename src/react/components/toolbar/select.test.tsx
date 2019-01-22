import React from "react";
import { IToolbarItemProps, ToolbarItemType } from "./toolbarItem";
import { mount, ReactWrapper } from "enzyme";
import IProjectActions, * as projectActions from "../../../redux/actions/projectActions";
import MockFactory from "../../../common/mockFactory";
import { Select } from "./select";

describe("Select Toolbar Item", () => {
    const testProject = MockFactory.createTestProject("TestProject");
    const clickHandler = jest.fn();
    const actions = (projectActions as any) as IProjectActions;
    let wrapper: ReactWrapper<IToolbarItemProps> = null;

    function createComponent(props: IToolbarItemProps) {
        return mount(<Select {...props} />);
    }

    function createProps(): IToolbarItemProps {
        return {
            name: "selectCanvas",
            tooltip: "Select",
            icon: "fa-mouse-pointer",
            group: "canvas",
            type: ToolbarItemType.State,
            actions,
            active: true,
            project: testProject,
            onClick: clickHandler,
        };
    }

    it("Sets the editor mode to Select on click", async () => {
        actions.saveProject = jest.fn(() => Promise.resolve());
        const props = createProps();
        wrapper = createComponent(props);

        await MockFactory.flushUi(() => wrapper.simulate("click"));

        expect(props.onClick).toBeCalledWith(wrapper.instance());
    });
});
