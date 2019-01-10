import React from "react";
import { mount, ReactWrapper } from "enzyme";
import axios from "axios";
import ExternalPicker, { IExternalPickerProps, IExternalPickerState } from "./externalPicker";
import MockFactory from "../../../../common/mockFactory";

describe("External Picker", () => {
    let wrapper: ReactWrapper<IExternalPickerProps, IExternalPickerState> = null;
    const onChangeHandler = jest.fn();
    const defaultProps = createProps({
        id: "my-custom-control",
        value: "",
        schema: {
            title: "Item Name",
        },
        formContext: {
            providerOptions: {
                apiKey: "",
            },
        },
        onChange: onChangeHandler,
        options: {
            method: "GET",
            url: "https://myserver/api",
            keySelector: "${item.key}",
            valueSelector: "${item.value}",
            authHeaderName: "Authorization",
            authHeaderValue: "${props.formContext.providerOptions.apiKey}",
        },
    });

    const testResponse = [
        { key: "1", value: "Option 1" },
        { key: "2", value: "Option 2" },
        { key: "3", value: "Option 3" },
        { key: "4", value: "Option 4" },
    ];

    function createComponent(props: IExternalPickerProps): ReactWrapper<IExternalPickerProps, IExternalPickerState> {
        return mount(<ExternalPicker {...props} />);
    }

    beforeAll(() => {
        axios.request = jest.fn(() => {
            return Promise.resolve({
                data: testResponse,
            });
        });
    });

    beforeEach(() => {
        wrapper = createComponent(defaultProps as IExternalPickerProps);
    });

    it("Renders select element with default option", () => {
        expect(wrapper.find("select").length).toEqual(1);
        expect(wrapper.find("option").length).toEqual(1);
    });

    it("Does not bind external data if authorization is missing", () => {
        expect(axios.request).not.toBeCalled();
    });

    it("Renders items bound from external data when formContext rebinds", async () => {
        const expectedApiKey = "ABC123";

        await MockFactory.flushUi(() => {
            wrapper.setProps({
                formContext: {
                    providerOptions: {
                        apiKey: expectedApiKey,
                    },
                },
            });
        });

        wrapper.update();

        const expectedHeaders = {};
        expectedHeaders[defaultProps.options.authHeaderName] = expectedApiKey;

        expect(axios.request).toBeCalledWith({
            method: defaultProps.options.method,
            url: defaultProps.options.url,
            headers: expectedHeaders,
        });

        const options = wrapper.find("option");
        expect(options.length).toEqual(testResponse.length + 1);
        expect(options.at(1).prop("value")).toEqual(testResponse[0].key);
        expect(options.at(1).text()).toEqual(testResponse[0].value);
        expect(wrapper.state("items").length).toEqual(testResponse.length);
    });

    it("Calls onChange event handler on option selection", () => {
        wrapper.setProps({
            formContext: {},
        });

        wrapper.find("select").simulate("change", { target: { value: testResponse[0].key } });
        expect(onChangeHandler).toBeCalledWith(testResponse[0].key);
    });

    function createProps(otherProps: any): IExternalPickerProps {
        const props: IExternalPickerProps = {
            ...otherProps,
        };

        return props;
    }
});
