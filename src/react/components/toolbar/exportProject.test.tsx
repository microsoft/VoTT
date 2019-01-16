import React from "react";
import { IToolbarItemProps, ToolbarItemType } from "./toolbarItem";
import { mount, ReactWrapper } from "enzyme";
import { ExportProject } from "./exportProject";
import IProjectActions, * as projectActions from "../../../redux/actions/projectActions";
import MockFactory from "../../../common/mockFactory";
import { IExportResults } from "../../../providers/export/exportProvider";

jest.mock("react-toastify");
import { toast } from "react-toastify";

describe("Export Project Toolbar Item", () => {
    const testProject = MockFactory.createTestProject("TestProject");
    const clickHandler = jest.fn();
    const actions = (projectActions as any) as IProjectActions;
    let wrapper: ReactWrapper<IToolbarItemProps> = null;

    function createComponent(props: IToolbarItemProps) {
        return mount(<ExportProject {...props} />);
    }

    function createProps(): IToolbarItemProps {
        return {
            name: "exportProject",
            tooltip: "Export Project",
            icon: "fa-external-link-square-alt",
            group: "project",
            type: ToolbarItemType.Action,
                actions,
            active: true,
            project: testProject,
            onClick: clickHandler,
            onEditorModeChange: jest.fn(),
            canvas: MockFactory.createTestCanvas(),
        };
    }

    beforeAll(() => {
        toast.info = jest.fn(() => 1);
        toast.success = jest.fn(() => 2);
        toast.warn = jest.fn(() => 3);
    });

    it("Calls export project action with not export results", async () => {
        actions.exportProject = jest.fn(() => Promise.resolve());
        const props = createProps();
        wrapper = createComponent(props);

        await MockFactory.flushUi(() => wrapper.simulate("click"));

        expect(toast.info).toBeCalled();
        expect(actions.exportProject).toBeCalledWith(testProject);
        expect(toast.dismiss).toBeCalledWith(1);
        expect(toast.success).toBeCalled();
    });

    it("Calls export project action with all success export results", async () => {
        const testAssets = MockFactory
            .createTestAssets(4)
            .map((asset) => MockFactory.createTestAssetMetadata(asset));

        const expectedResults: IExportResults = {
            completed: [
                { asset: testAssets[0], success: true },
                { asset: testAssets[1], success: true },
                { asset: testAssets[2], success: true },
                { asset: testAssets[3], success: true },
            ],
            errors: [],
            count: testAssets.length,
        };

        actions.exportProject = jest.fn(() => Promise.resolve(expectedResults));
        const props = createProps();
        wrapper = createComponent(props);

        await MockFactory.flushUi(() => wrapper.simulate("click"));

        expect(toast.info).toBeCalled();
        expect(actions.exportProject).toBeCalledWith(testProject);
        expect(toast.dismiss).toBeCalledWith(1);
        expect(toast.success).toBeCalled();
    });

    it("Calls export project action with mixed export results", async () => {
        const testAssets = MockFactory
            .createTestAssets(4)
            .map((asset) => MockFactory.createTestAssetMetadata(asset));

        const expectedResults: IExportResults = {
            completed: [
                { asset: testAssets[0], success: true },
                { asset: testAssets[1], success: true },
            ],
            errors: [
                { asset: testAssets[2], success: false, error: "Error creating image" },
                { asset: testAssets[3], success: false, error: "Error creating image" },
            ],
            count: testAssets.length,
        };

        actions.exportProject = jest.fn(() => Promise.resolve(expectedResults));
        const props = createProps();
        wrapper = createComponent(props);

        await MockFactory.flushUi(() => wrapper.simulate("click"));

        expect(toast.info).toBeCalled();
        expect(actions.exportProject).toBeCalledWith(testProject);
        expect(toast.dismiss).toBeCalledWith(1);
        expect(toast.warn).toBeCalled();
    });
});
