import React from "react";
import _ from "lodash";
import MockFactory from "../../../../common/mockFactory";
import { ReactWrapper, mount } from "enzyme";
import Canvas, { ICanvasProps } from "./canvas";
import { EditorMode } from "../../../../models/applicationState";

describe("Editor Toolbar", () => {
    let wrapper: ReactWrapper = null;

    function createComponent(props: ICanvasProps) {
        return (mount(<Canvas {...props} />));
    }

    function createProps(): ICanvasProps {
        return {
            selectedAsset: MockFactory.createTestAssetMetadata(MockFactory.createTestAsset('test')),
            onAssetMetadataChanged: jest.fn(),
            editorMode: EditorMode.Rectangle
        };
    }

    beforeEach(() => {
        const props = createProps();
        wrapper = createComponent(props);
    });

    it("onSelectionEnd adds region to asset", ()=>{});
    it("onRegionMove edits region info in asset", ()=>{});
    it("onRegionDelete removes region from asset", ()=>{});
    it("onRegionSelected adds region to list of selected regions on asset", ()=>{});
});