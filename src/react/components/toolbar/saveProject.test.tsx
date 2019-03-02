import React from "react";
import { IToolbarItemProps, ToolbarItemType } from "./toolbarItem";
import { mount, ReactWrapper } from "enzyme";
import { SaveProject } from "./saveProject";
import IProjectActions, * as projectActions from "../../../redux/actions/projectActions";
import MockFactory from "../../../common/mockFactory";

jest.mock("react-toastify");
import { toast } from "react-toastify";
import { ToolbarItemName, ToolbarItemGroup } from "../../../registerToolbar";

describe("Save Project Toolbar Item", () => {
    const testProject = MockFactory.createTestProject("TestProject");
    const clickHandler = jest.fn();
    const actions = (projectActions as any) as IProjectActions;
    let wrapper: ReactWrapper<IToolbarItemProps> = null;

    function createComponent(props: IToolbarItemProps) {
        return mount(<SaveProject {...props} />);
    }

    function createProps(): IToolbarItemProps {
        return {
            name: ToolbarItemName.SaveProject,
            tooltip: "Save Project",
            icon: "fa-save",
            group: ToolbarItemGroup.Project,
            type: ToolbarItemType.Action,
            actions,
            active: true,
            project: testProject,
            onClick: clickHandler,
        };
    }

    beforeAll(() => {
        toast.info = jest.fn(() => 1);
        toast.success = jest.fn(() => 2);
        toast.error = jest.fn(() => 3);
    });

    it("Calls save project action with successfull result", async () => {
        actions.saveProject = jest.fn(() => Promise.resolve());
        const props = createProps();
        wrapper = createComponent(props);

        await MockFactory.flushUi(() => wrapper.simulate("click"));

        expect(actions.saveProject).toBeCalledWith(testProject);
        expect(toast.success).toBeCalled();
    });

    it("Calls save project action with failed result", async () => {
        actions.saveProject = jest.fn(() => Promise.reject("Error saving project"));
        const props = createProps();
        wrapper = createComponent(props);

        await MockFactory.flushUi(() => wrapper.simulate("click"));

        expect(actions.saveProject).toBeCalledWith(testProject);
        expect(toast.error).toBeCalled();
    });
});
