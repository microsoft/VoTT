import React from "react";
import { FieldTemplateProps, Field } from "react-jsonschema-form";
import { ReactWrapper, mount } from "enzyme";
import CustomFieldTemplate from "./customFieldTemplate";

describe("Custom Field Template Component", () => {
    const defaultProps: any = {
        id: "dom-id",
        label: "I am the label",
        rawDescription: "I am the description",
        description: null,
        required: true,
        rawErrors: [],
        schema: {
            type: "field",
        },
        uiSchema: {},
    };

    function createProps(props: any = {}): FieldTemplateProps {
        return {
            ...defaultProps,
            ...props,
        };
    }

    function createComponent(props: FieldTemplateProps): ReactWrapper {
        return mount(<CustomFieldTemplate {...props} />);
    }

    it("renders with 'object-wrapper' when schema is an object", () => {
        const props = createProps({
            schema: {
                type: "object",
            },
        });
        const wrapper = createComponent(props);

        expect(wrapper.find(".object-wrapper").exists()).toBe(true);
    });

    it("renders with 'form-group' when schema is a field", () => {
        const props = createProps({
            label: "Custom label",
            description: "Custom description",
            required: true,
            schema: {
                type: "field",
            },
        });
        const wrapper = createComponent(props);

        expect(wrapper.find(".form-group").exists()).toBe(true);
        expect(wrapper.find("label").exists()).toBe(true);
        expect(wrapper.find("label").text()).toEqual(`${props.label}*`);
        expect(wrapper.find(".text-muted").exists()).toBe(true);
        expect(wrapper.find(".text-muted").text()).toEqual(props.description);
    });

    it("renders with 'is-invalid' when form contains errors", () => {
        const props = createProps({
            rawErrors: ["Error 1"],
            schema: {
                type: "field",
            },
        });
        const wrapper = createComponent(props);

        expect(wrapper.find(".is-invalid").exists()).toBe(true);
    });

    it("renders with 'is-valid' when form does not contain errors", () => {
        const props = createProps({
            rawErrors: [],
            schema: {
                type: "field",
            },
        });
        const wrapper = createComponent(props);

        expect(wrapper.find(".is-valid").exists()).toBe(true);
    });

    it("renders error messages when an error exists", () => {
        const props = createProps({
            rawErrors: ["Error 1"],
            schema: {
                type: "field",
            },
        });
        const wrapper = createComponent(props);

        expect(wrapper.find(".invalid-feedback").text()).toContain(props.rawErrors[0]);
    });

    it("renders an array template correctly", () => {
        const props = createProps({
            label: "Array Label",
            description: "Array Description",
            schema: {
                type: "array",
            },
        });
        const wrapper = createComponent(props);

        expect(wrapper.find("h4").exists()).toBe(true);
        expect(wrapper.find("h4").text()).toEqual(props.label);
        expect(wrapper.find("small").exists()).toBe(true);
        expect(wrapper.find("small").text()).toEqual(props.description);
    });
});
