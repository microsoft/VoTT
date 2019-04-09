import React from "react";
import { mount, ReactWrapper } from "enzyme";
import MockFactory from "../../../../common/mockFactory";
import ConnectionForm, { IConnectionFormProps, IConnectionFormState } from "./connectionForm";

jest.mock("../../../../common/hostProcess", () => ({
    isBrowser: jest.fn(),
}));
import { isBrowser } from "../../../../common/hostProcess";

describe("Connection Form", () => {
    const onSubmitHandler = jest.fn();
    const testConnection = MockFactory.createTestConnection("test", "localFileSystemProxy");
    let wrapper: ReactWrapper<IConnectionFormProps, IConnectionFormState> = null;

    function createComponent(props: IConnectionFormProps): ReactWrapper<IConnectionFormProps, IConnectionFormState> {
        return mount(
            <ConnectionForm {...props} />,
        );
    }

    beforeEach(() => {
        wrapper = createComponent({
            connection: testConnection,
            onSubmit: onSubmitHandler,
        });
    });

    it("should update formData in state when changes occur", async () => {
        const expected = "Test Value";

        wrapper
            .find("input#root_name")
            .simulate("change", { target: { value: expected } });

        await MockFactory.flushUi();

        expect(wrapper.state().formData.name).toEqual(expected);
    });

    it("should update provider options when new type is set", async () => {
        wrapper
            .find("select#root_providerType")
            .simulate("change", { target: { value: "bingImageSearch" } });

        await MockFactory.flushUi();

        const providerOptions = wrapper.state().formData.providerOptions;
        expect(wrapper.state().formData.providerType).toEqual("bingImageSearch");
        expect("apiKey" in providerOptions).toBe(true);
        expect("query" in providerOptions).toBe(true);
        expect("aspectRatio" in providerOptions).toBe(true);
    });

    it("should display warning for Bing Image Search when running in a browser", async () => {
        const isBrowserMock = isBrowser as jest.Mock;
        isBrowserMock.mockReturnValue(true);

        wrapper
            .find("select#root_providerType")
            .simulate("change", { target: { value: "bingImageSearch" } });

        await MockFactory.flushUi();
        wrapper.update();

        const providerOptions = wrapper.state().formData.providerOptions;
        expect(wrapper.state().formData.providerType).toEqual("bingImageSearch");
        expect(wrapper.exists("div.alert")).toEqual(true);
    });

    it("should display warning for Blob Storage when running in a browser", async () => {
        const isBrowserMock = isBrowser as jest.Mock;
        isBrowserMock.mockReturnValue(true);

        wrapper
            .find("select#root_providerType")
            .simulate("change", { target: { value: "azureBlobStorage" } });

        await MockFactory.flushUi();
        wrapper.update();

        const providerOptions = wrapper.state().formData.providerOptions;
        expect(wrapper.state().formData.providerType).toEqual("azureBlobStorage");
        expect(wrapper.exists("div.alert")).toEqual(true);
    });

    it("should call the onSubmit event handler when the form is submitted", async () => {
        wrapper.find("form").simulate("submit");

        await MockFactory.flushUi();
        expect(onSubmitHandler).toBeCalledWith(testConnection);
    });
});
