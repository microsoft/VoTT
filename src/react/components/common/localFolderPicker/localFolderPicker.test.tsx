import React from "react";
import LocalFolderPicker from "./localFolderPicker";
import { mount } from "enzyme";

jest.mock("../../../../providers/storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../../../../providers/storage/localFileSystemProxy";

describe("Local Folder Picker Component", () => {
    const onChangeHandler = jest.fn();

    function createComponent(value: string, onChangeHandler: () => void) {
        return mount(
            <LocalFolderPicker
                value={value}
                onChange={onChangeHandler} />,
        );
    }

    it("renders correctly", () => {
        const wrapper = createComponent(null, onChangeHandler);
        const input = wrapper.find("input");
        const button = wrapper.find("button");

        expect(input.length).toEqual(1);
        expect(button.length).toEqual(1);
    });

    it("sets input value from null props", () => {
        const wrapper = createComponent(null, onChangeHandler);
        const expectedValue = "";
        const actualValue = wrapper.state()["value"];
        expect(actualValue).toEqual(expectedValue);
    });

    it("sets input value from set props", () => {
        const expectedValue = "C:\\Users\\User1\\Desktop";
        const wrapper = createComponent(expectedValue, onChangeHandler);
        const actualValue = wrapper.state()["value"];
        expect(actualValue).toEqual(expectedValue);
    });

    it("Calls electron to select folder from open dialog", (done) => {
        const expectedValue = "C:\\Users\\User1\\test.txt";
        const mocked = LocalFileSystemProxy as jest.Mocked<typeof LocalFileSystemProxy>;
        mocked.prototype.selectContainer = jest.fn(() => Promise.resolve(expectedValue));

        const wrapper = createComponent(null, onChangeHandler);
        wrapper.find("button").simulate("click");

        setImmediate(() => {
            expect(onChangeHandler).toBeCalledWith(expectedValue);
            done();
        });
    });
});
