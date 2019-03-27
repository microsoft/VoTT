import React from "react";
import EditorSideBar, { IEditorSideBarProps, IEditorSideBarState } from "./editorSideBar";
import { ReactWrapper, mount } from "enzyme";
import { AutoSizer, List } from "react-virtualized";
import MockFactory from "../../../../common/mockFactory";

describe("Editor SideBar", () => {
    const onSelectAssetHandler = jest.fn();
    const testAssets = MockFactory.createTestAssets();

    function createComponent(props: IEditorSideBarProps): ReactWrapper<IEditorSideBarProps, IEditorSideBarState> {
        return mount(<EditorSideBar {...props} />);
    }

    it("Component renders correctly", () => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            onAssetSelected: onSelectAssetHandler,
        };

        const wrapper = createComponent(props);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find(AutoSizer).exists()).toBe(true);
        expect(wrapper.find(List).exists()).toBe(true);
    });

    it("Initializes state without asset selected", () => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            onAssetSelected: onSelectAssetHandler,
        };

        const wrapper = createComponent(props);
        expect(wrapper.props().selectedAsset).not.toBeDefined();
        expect(wrapper.state().scrollToIndex).toBe(0);
    });

    it("Initializes state with asset selected", () => {
        const selectedAssetIndex = 3;

        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: testAssets[selectedAssetIndex],
            onAssetSelected: onSelectAssetHandler,
        };

        const wrapper = createComponent(props);
        expect(wrapper.props().selectedAsset).toEqual(props.selectedAsset);
        expect(wrapper.state().scrollToIndex).toBe(selectedAssetIndex);
    });

    it("Updates states after props have changed", (done) => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: null,
            onAssetSelected: onSelectAssetHandler,
        };

        const wrapper = createComponent(props);

        const selectedAssetIndex = 3;
        wrapper.setProps({
            selectedAsset: testAssets[selectedAssetIndex],
        });

        setImmediate(() => {
            const state = wrapper.state();
            expect(wrapper.props().selectedAsset).toEqual(testAssets[selectedAssetIndex]);
            expect(state.scrollToIndex).toEqual(selectedAssetIndex);

            done();
        });
    });

    it("Correctly switches between assets", async () => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: testAssets[0],
            onAssetSelected: onSelectAssetHandler,
        };

        const wrapper = createComponent(props);

        // first props update
        const firstUpdate = testAssets[6];
        wrapper.setProps({
            selectedAsset: firstUpdate,
        });

        await MockFactory.flushUi();

        let state = wrapper.state();
        expect(wrapper.props().selectedAsset).toEqual(firstUpdate);
        expect(state.scrollToIndex).toEqual(6);

        // second props update
        const secondUpdate = testAssets[3];
        wrapper.setProps({
            selectedAsset: secondUpdate,
        });

        await MockFactory.flushUi();

        state = wrapper.state();
        expect(wrapper.props().selectedAsset).toEqual(secondUpdate);
        expect(state.scrollToIndex).toEqual(3);
    });

    it("Updates row sizes when thumbnail size is changed", () => {
        const props: IEditorSideBarProps = {
            assets: testAssets,
            onAssetSelected: onSelectAssetHandler,
            thumbnailSize: {
                width: 175,
                height: 155,
            },
        };

        const wrapper = createComponent(props);
        const list = wrapper.find(List).instance() as List;
        const recomputeRowHeightsSpy = jest.spyOn(list, "recomputeRowHeights");

        wrapper.setProps({
            thumbnailSize: {
                width: 300,
                height: 200,
            },
        });

        expect(recomputeRowHeightsSpy).toBeCalled();
    });
});
