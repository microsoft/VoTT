import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../common/mockFactory";
import { CloudFilePicker, ICloudFilePickerProps } from "./cloudFilePicker";

describe("CloudFilePicker", () => {
    function createComponent(props: ICloudFilePickerProps) {
        return mount(<CloudFilePicker {...props}/>);
    }

    it("modal is visible", () => {
        const connections = MockFactory.createTestConnections();
        const onCancel = jest.fn();
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            connections,
            isOpen: true,
            onCancel,
            onSubmit,
        });
    });

    it("modal is not visible", () => {
        const connections = MockFactory.createTestConnections();
        const onCancel = jest.fn();
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            connections,
            isOpen: false,
            onCancel,
            onSubmit,
        });
    });
});
