import React from "react";
import { mount, ReactWrapper } from "enzyme";
import _ from "lodash";
import ExportProviderPicker, { IExportProviderPickerProps } from "./exportProviderPicker";
import MockFactory from "../../../../common/mockFactory";

jest.mock("../../../../providers/export/exportProviderFactory");
import { ExportProviderFactory } from "../../../../providers/export/exportProviderFactory";

describe("Export Provider Picker", () => {
    const exportProviderRegistrations = MockFactory.createExportProviderRegistrations();

    let wrapper: ReactWrapper;

    const onChangeHandler = jest.fn();
    const defaultProps: IExportProviderPickerProps = {
        id: "test-export-provider-picker",
        value: "azureCustomVision",
        onChange: onChangeHandler,
    };

    function createComponent(props: IExportProviderPickerProps) {
        return mount(<ExportProviderPicker {...props} />);
    }

    beforeAll(() => {
        Object.defineProperty(ExportProviderFactory, "providers", {
            get: jest.fn(() => exportProviderRegistrations),
        });
    });

    describe("With default properties", () => {
        beforeEach(() => {
            wrapper = createComponent(defaultProps);
        });

        it("Renders a dropdown with all export providers", () => {
            const exportProviders = _.values(exportProviderRegistrations);

            const allProviders = _([])
                .concat(exportProviders)
                .orderBy("displayName")
                .value();

            const picker = wrapper.find("select");
            const htmlNode = picker.getDOMNode() as HTMLSelectElement;

            // Count of unique providers + the "Select" option
            expect(htmlNode.id).toEqual(defaultProps.id);
            expect(htmlNode.value).toEqual(defaultProps.value);
            expect(picker.find("option").length).toEqual(allProviders.length);
        });

        it("Calls registred onChange handler when value changes", async () => {
            await MockFactory.flushUi(() => {
                wrapper.find("select").simulate("change", { target: { value: exportProviderRegistrations[1].name } });
            });

            expect(onChangeHandler).toBeCalledWith(exportProviderRegistrations[1].name);
        });
    });

    describe("With property overrides", () => {
        it("Selects correct option based on value", () => {
            const props = {
                ...defaultProps,
                value: exportProviderRegistrations[1].name,
            };
            wrapper = createComponent(props);

            const htmlNode = wrapper.find("select").getDOMNode() as HTMLSelectElement;
            expect(htmlNode.value).toEqual(props.value);
        });
    });
});
