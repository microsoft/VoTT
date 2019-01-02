import { mount } from "enzyme";
import React from "react";
import MockFactory from "../../../../common/mockFactory";
import { CloudFilePicker, ICloudFilePickerProps } from "./cloudFilePicker";
import { IStorageProvider, StorageProviderFactory } from "../../../../providers/storage/storageProvider";


describe("CloudFilePicker", () => {
    function createComponent(props: ICloudFilePickerProps) {
        return mount(<CloudFilePicker {...props}/>);
    }

    const mockFiles = ["file1.json", "file2.json", "file3.json"]

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
        expect(wrapper.find("div.modal-content").exists()).toBe(true);
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
        expect(wrapper.find("div.modal-content").exists()).toBe(false);
    });

    it("only shows cloud connections", () => {
        const connections = MockFactory.createTestConnections();
        const onCancel = jest.fn();
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            connections,
            isOpen: true,
            onCancel,
            onSubmit,
        });
        expect(wrapper.find("a")).toHaveLength(connections.length / 2);
    });

    it("sets selected connection", () => {
        const mockStorageProvider = MockFactory.createStorageProvider(mockFiles);
        StorageProviderFactory.create = jest.fn(() => mockStorageProvider);
        const connections = MockFactory.createTestConnections();
        const onCancel = jest.fn();
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            connections,
            isOpen: true,
            onCancel,
            onSubmit,
        });
        wrapper.find("a").first().simulate("click");
        setImmediate(() => {
            const state = wrapper.find(CloudFilePicker).state();
            expect(state.backDisabled).toBe(false);
            expect(state.okDisabled).toBe(true);
            expect(state.selectedFile).toBeNull();
            expect(state.modalHeader).toEqual(`Select a file from "Connection 1"`);
            expect(state.selectedConnection).toEqual(connections[0]);
            expect(wrapper.find("a")).toHaveLength(mockFiles.length);
        });
    });

    function wrapInPromise(fn): Promise<void>{
        return new Promise((resolve,reject) => {
            setImmediate(() => {
                fn();
                resolve();
            })
        });
    }

    it("sets selected file", async () => {
        const mockStorageProvider = MockFactory.createStorageProvider(mockFiles);
        StorageProviderFactory.create = jest.fn(() => mockStorageProvider);
        const connections = MockFactory.createTestConnections();
        const onCancel = jest.fn();
        const onSubmit = jest.fn();
        const wrapper = createComponent({
            connections,
            isOpen: true,
            onCancel,
            onSubmit,
        });
        await wrapInPromise(() => wrapper.find("a").first().simulate("click"))
        await wrapInPromise(() => wrapper.find("a").first().simulate("click"))
        const state = wrapper.find(CloudFilePicker).state();
        expect(state.selectedFile).toEqual(mockFiles[0]);
        expect(state.okDisabled).toBe(false);        
    });

    // it("displays filename in footer when selected", () => {

    // })

    // it("resets state when 'Go Back' is clicked", () => {

    // });

    // it("resets state and closes when exit is clicked", () => {

    // });

    // it("calls onSubmit when 'Ok' is clicked", () => {

    // });
});
