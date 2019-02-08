import React from "react";
import { IToolbarItemProps, ToolbarItemType } from "./toolbarItem";
import { mount, ReactWrapper } from "enzyme";
import IProjectActions, * as projectActions from "../../../redux/actions/projectActions";
import MockFactory from "../../../common/mockFactory";
import { PasteRegions } from "./pasteRegions";

describe("Paste Regions Toolbar Item", () => {
    const testProject = MockFactory.createTestProject("TestProject");
    const clickHandler = jest.fn();
    const actions = (projectActions as any) as IProjectActions;
    const wrapper: ReactWrapper<IToolbarItemProps> = null;

    function createComponent(props: IToolbarItemProps) {
        return mount(<PasteRegions {...props} />);
    }

    function createProps(): IToolbarItemProps {
        return {
            name: "pasteRegions",
            tooltip: "Paste Regions",
            icon: "fa-paste",
            group: "regions",
            type: ToolbarItemType.Action,
            actions,
            active: true,
            project: testProject,
            onClick: clickHandler,
        };
    }

    it("Stub test", async () => {
        expect(true).toBeTruthy();
    });
});
