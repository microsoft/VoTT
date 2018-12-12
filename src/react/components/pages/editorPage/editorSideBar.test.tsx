import React from "react";
import EditorSideBar, { IEditorSideBarProps } from "./editorSideBar";
import { ReactWrapper, mount } from "enzyme";
import { AutoSizer, List } from "react-virtualized";
import { IAsset, AssetState, AssetType } from "../../../../models/applicationState";

describe("Editor SideBar", () => {
    const onSelectAssetHanlder = jest.fn();

    function createComponent(props: IEditorSideBarProps): ReactWrapper {
        return mount(<EditorSideBar {...props} />);
    }

    it("Component renders correctly", () => {
        const props: IEditorSideBarProps = {
            assets: getTestAssets(),
            onAssetSelected: onSelectAssetHanlder,
        };

        const wrapper = createComponent(props);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find(AutoSizer).exists()).toBe(true);
        expect(wrapper.find(List).exists()).toBe(true);
    });

    it("Initializes state without asset selected", () => {
        const props: IEditorSideBarProps = {
            assets: getTestAssets(),
            onAssetSelected: onSelectAssetHanlder,
        };

        const wrapper = createComponent(props);
        expect(wrapper.state("selectedAsset")).not.toBeDefined();
    });

    it("Initializes state with asset selected", () => {
        const testAssets = getTestAssets();
        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: testAssets[0],
            onAssetSelected: onSelectAssetHanlder,
        };

        const wrapper = createComponent(props);
        expect(wrapper.state("selectedAsset")).toEqual(props.selectedAsset);
    });

    it("Updates states after props have changed", (done) => {
        const testAssets = getTestAssets();
        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: null,
            onAssetSelected: onSelectAssetHanlder,
        };

        const wrapper = createComponent(props);
        wrapper.setProps({
            selectedAsset: testAssets[0],
        });

        setImmediate(() => {
            expect(wrapper.state("selectedAsset")).toEqual(testAssets[0]);
            done();
        });
    });

    // Not able to get the virtualized list to render in the headless browser.
    xit("Calls onAssetSelected handler when an asset is selected", (done) => {
        const testAssets = getTestAssets();
        const props: IEditorSideBarProps = {
            assets: testAssets,
            selectedAsset: testAssets[0],
            onAssetSelected: onSelectAssetHanlder,
            style: {
                width: "300px",
                height: "1000px",
            },
        };

        const wrapper = createComponent(props);
        wrapper.find(".asset-item").at(1).simulate("click");

        setImmediate(() => {
            expect(wrapper.state()["selectedAsset"]).toEqual(testAssets[1]);
            expect(onSelectAssetHanlder).toBeCalledWith(testAssets[1]);
            done();
        });
    });
});

function getTestAssets(count: number = 10): IAsset[] {
    const assets: IAsset[] = [];
    for (let i = 1; i <= count; i++) {
        assets.push({
            id: `asset-${i}`,
            name: `Asset ${i}`,
            format: "jpg",
            path: `http://myserver.com/asset-${i}.jpg`,
            size: null,
            state: AssetState.NotVisited,
            type: AssetType.Image,
        });
    }

    return assets;
}
