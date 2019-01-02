import React, { RefObject } from "react";
import { ReactWrapper, mount } from "enzyme";
import FilePicker from "./filePicker";
import HtmlFileReader from "../../../../common/htmlFileReader";

describe("File Picker Component", () => {
    let wrapper: ReactWrapper = null;
    const onChangeHandler = jest.fn();
    const onErrorHandler = jest.fn();

    function createComponent(): ReactWrapper {
        return mount(
            <FilePicker
                onChange={onChangeHandler}
                onError={onErrorHandler} />,
        );
    }

    beforeEach(() => {
        wrapper = createComponent();
    });

    it("Renders a HTML input with type file element", () => {
        const input = wrapper.find("input").first();
        expect(input).not.toBeNull();
        expect(input.prop("type")).toEqual("file");
    });

    it("Calls the onChange handler on successfull file upload", (done) => {
        const expectedContent = "test file content";
        HtmlFileReader.readAsText = jest.fn(() => Promise.resolve(expectedContent));
        const event: any = {
            target: {
                files: ["text.txt"],
            },
        };

        wrapper.find("input").first().simulate("change", event);

        setImmediate(() => {
            expect(onChangeHandler).toBeCalledWith(expect.anything(), expectedContent);
            done();
        });
    });

    it("Calls the onError handler on errored / cancelled file upload", (done) => {
        const event: any = {
            target: {
                files: [],
            },
        };

        wrapper.find("input").first().simulate("change", event);

        setImmediate(() => {
            expect(onErrorHandler).toBeCalledWith(expect.anything(), "No files were selected");
            done();
        });
    });
});
