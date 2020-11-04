import React from "react";
import { ReactWrapper, mount } from "enzyme";
import FilePicker from "./filePicker";
import HtmlFileReader from "../../../../common/htmlFileReader";
import MockFactory from "../../../../common/mockFactory";

describe("File Picker Component", () => {
    let wrapper: ReactWrapper = null;
    let onChangeHandler = null;
    let onErrorHandler = null;

    function createComponent(): ReactWrapper {
        return mount(
            <FilePicker
                onChange={onChangeHandler}
                onError={onErrorHandler} />,
        );
    }

    beforeEach(() => {
        onChangeHandler = jest.fn();
        onErrorHandler = jest.fn();
        wrapper = createComponent();
    });

    it("Renders a HTML input with type file element", () => {
        const input = wrapper.find("input").first();
        expect(input).not.toBeNull();
        expect(input.prop("type")).toEqual("file");
    });

    it("Calls the onChange handler on successfully file upload", (done) => {
        const expectedContent = "test file content";
        HtmlFileReader.readAsText = jest.fn(() => Promise.resolve(expectedContent)) as any;
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

    it("Calls the onError handler on error / cancelled file upload", async () => {
        const event: any = {
            target: {
                files: [],
            },
        };

        wrapper.find("input").first().simulate("change", event);

        await MockFactory.flushUi();
        expect(onErrorHandler).toBeCalledWith(expect.anything(), "No files were selected");
    });
});
