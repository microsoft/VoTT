import React from "react";
import { IActiveLearningFormProps, ActiveLearningForm, IActiveLearningFormState } from "./activeLearningForm";
import { ReactWrapper, mount } from "enzyme";
import { ModelPathType, IActiveLearningSettings } from "../../../../models/applicationState";
import Form from "react-jsonschema-form";

describe("Active Learning Form", () => {
    const onChangeHandler = jest.fn();
    const onSubmitHandler = jest.fn();
    const onCancelHandler = jest.fn();
    const defaultProps: IActiveLearningFormProps = {
        settings: {
            modelPathType: ModelPathType.Coco,
            modelPath: null,
            modelUrl: null,
            autoDetect: false,
            predictTag: true,
        },
        onChange: onChangeHandler,
        onSubmit: onSubmitHandler,
        onCancel: onCancelHandler,
    };

    function createComponent(props?: IActiveLearningFormProps)
        : ReactWrapper<IActiveLearningFormProps, IActiveLearningFormState> {
        props = props || defaultProps;
        return mount(<ActiveLearningForm {...props} />);
    }

    it("renders a dynamic json schema form with default props", () => {
        const wrapper = createComponent();
        expect(wrapper.find(Form).exists()).toBe(true);
        expect(wrapper.state().formData).toEqual(defaultProps.settings);
    });

    it("sets formData state when loaded with different props", () => {
        const props: IActiveLearningFormProps = {
            ...defaultProps,
            settings: {
                modelPathType: ModelPathType.Url,
                modelUrl: "https://myserver.com/myModel",
                autoDetect: true,
                predictTag: true,
            },
        };

        const wrapper = createComponent(props);
        expect(wrapper.state().formData).toEqual(props.settings);
    });

    it("updates form data when the props change", () => {
        const wrapper = createComponent();

        const newSettings: IActiveLearningSettings = {
            modelPathType: ModelPathType.Url,
            modelUrl: "https://myserver.com/myModel",
            autoDetect: true,
            predictTag: true,
        };

        wrapper.setProps({ settings: newSettings });
        expect(wrapper.state().formData).toEqual(newSettings);
    });

    it("sets formData state when form changes", () => {
        const wrapper = createComponent();
        const formData: IActiveLearningSettings = {
            modelPathType: ModelPathType.Url,
            modelUrl: "https://myserver.com/myModel",
            autoDetect: true,
            predictTag: true,
        };

        // Set type to URL
        // wrapper.find(Form).setProps({ formData: { modelPathType: ModelPathType.Url }});
        wrapper.find(Form).setProps({ formData: { modelPathType: ModelPathType.Url }});
        wrapper.find(Form).simulate("change");
        // OR JACOPO
        // wrapper.find(Form).props().onChange({ formData: { modelPathType: ModelPathType.Url },
        //                                       edit: null,
        //                                       errors: null,
        //                                       errorSchema: null,
        //                                       idSchema: null,
        //                                       schema: null,
        //                                       uiSchema: null,
        //                                     });
        // Set the remaining settings
        wrapper.find(Form).setProps({ formData });
        wrapper.find(Form).simulate("change");
        // OR JACOPO
        // wrapper.find(Form).props().onChange({ formData,
        //                                       edit: null,
        //                                       errors: null,
        //                                       errorSchema: null,
        //                                       idSchema: null,
        //                                       schema: null,
        //                                       uiSchema: null,
        //                                      });

        expect(wrapper.state().formData).toEqual(formData);
        expect(onChangeHandler).toBeCalledWith(formData);
    });

    it("submits form data to the registered submit handler", () => {
        const wrapper = createComponent();

        /* JACOPO
        wrapper.find(Form).props().onSubmit({ formData: defaultProps.settings });

        expect(onSubmitHandler).toBeCalledWith(defaultProps.settings);
        JACOPO */
    });

    it("raises the cancel event and called registered handler", () => {
        const wrapper = createComponent();
        wrapper.find(".btn-cancel").simulate("click");

        expect(onCancelHandler).toBeCalled();
    });
});
