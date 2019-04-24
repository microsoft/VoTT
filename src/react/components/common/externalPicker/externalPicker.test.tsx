import React from "react";
import { mount, ReactWrapper } from "enzyme";
import axios from "axios";
import ExternalPicker, { IExternalPickerProps, IExternalPickerState, FilterOperator } from "./externalPicker";
import MockFactory from "../../../../common/mockFactory";

describe("External Picker", () => {
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
                region: "",
            },
        },
        onChange: onChangeHandler,
        options: {
            method: "GET",
            url: "https://${props.formContext.providerOptions.region}.server.com/api",
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

    it("Renders select element with default option", () => {
        const wrapper = createComponent(defaultProps);
        expect(wrapper.find("select").length).toEqual(1);
        expect(wrapper.find("option").length).toEqual(1);
    });

    it("Does not bind external data if authorization is missing", () => {
        createComponent(defaultProps);
        expect(axios.request).not.toBeCalled();
    });

    it("Renders items bound from external data when formContext rebinds", async () => {
        const expectedApiKey = "ABC123";
        const expectedRegion = "southcentralus";

        const props = {
            ...defaultProps,
            formContext: {
                providerOptions: {
                    apiKey: expectedApiKey,
                    region: expectedRegion,
                },
            },
        };

        const wrapper = createComponent(props);

        await MockFactory.flushUi();
        wrapper.update();

        const expectedHeaders = {};
        expectedHeaders[defaultProps.options.authHeaderName] = expectedApiKey;

        expect(axios.request).toBeCalledWith({
            method: defaultProps.options.method,
            url: `https://${expectedRegion}.server.com/api`,
            headers: expectedHeaders,
        });

        const options = wrapper.find("option");
        expect(options.length).toEqual(testResponse.length + 1);
        expect(options.at(1).prop("value")).toEqual(testResponse[0].key);
        expect(options.at(1).text()).toEqual(testResponse[0].value);
        expect(wrapper.state("items").length).toEqual(testResponse.length);
    });

    it("Calls onChange event handler on option selection", () => {
        const wrapper = createComponent(defaultProps);

        wrapper.find("select").simulate("change", { target: { value: testResponse[0].key } });
        expect(onChangeHandler).toBeCalledWith(testResponse[0].key);
    });

    it("Clears items when HTTP request fails", async () => {
        const requestMock = axios.request as jest.Mock;
        requestMock.mockImplementationOnce(() => Promise.reject({ status: 400 }));

        const expectedApiKey = "ABC123";
        const expectedRegion = "southcentralus";

        const props: IExternalPickerProps = {
            ...defaultProps,
            formContext: {
                providerOptions: {
                    apiKey: expectedApiKey,
                    region: expectedRegion,
                },
            },
        };

        const wrapper = createComponent(props);
        await MockFactory.flushUi();

        expect(wrapper.state().items).toEqual([]);
        expect(onChangeHandler).toBeCalledWith(undefined);
    });

    describe("Filters items", () => {
        it("Applies a filter to the item when defined", async () => {
            const requestMock = axios.request as jest.Mock;
            requestMock.mockImplementationOnce(() => Promise.resolve({
                data: [
                    { id: "1", name: "Object Detection 1", type: "ObjectDetection" },
                    { id: "2", name: "Object Detection 2", type: "ObjectDetection" },
                    { id: "3", name: "Classification 1", type: "Classification" },
                    { id: "4", name: "Classification 2", type: "Classification" },
                ],
                status: 200,
            }));

            const props: IExternalPickerProps = {
                ...defaultProps,
                formContext: {
                    providerOptions: {
                        apiKey: "ABC123",
                        region: "southcentralus",
                        projectType: "Classification",
                    },
                },
            };

            props.options.keySelector = "${item.id}";
            props.options.valueSelector = "${item.name}";
            props.options.filter = {
                left: "${item.type}",
                right: "${props.formContext.providerOptions.projectType}",
                operator: FilterOperator.Equals,
            };

            const wrapper = createComponent(props);
            await MockFactory.flushUi();

            expect(wrapper.state().items).toEqual([
                { key: "3", value: "Classification 1" },
                { key: "4", value: "Classification 2" },
            ]);
        });
    });

    function createProps(otherProps: any): IExternalPickerProps {
        return {
            ...otherProps,
        };
    }
});
