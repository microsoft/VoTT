import React from "react";
import { IAppSettingsFormProps, IAppSettingsFormState, AppSettingsForm } from "./appSettingsForm";
import { ReactWrapper, mount } from "enzyme";
import { IAppSettings } from "../../../../models/applicationState";
import MockFactory from "../../../../common/mockFactory";

describe("App Settings Form", () => {
    let wrapper: ReactWrapper<IAppSettingsFormProps, IAppSettingsFormState>;
    const onSubmitHandler = jest.fn();
    const onCancelHandler = jest.fn();
    const defaultAppSettings: IAppSettings = {
        devToolsEnabled: false,
        securityTokens: [],
    };

    function createComponent(props: IAppSettingsFormProps = null)
        : ReactWrapper<IAppSettingsFormProps, IAppSettingsFormState> {
        props = props || createProps(defaultAppSettings);
        return mount(<AppSettingsForm {...props} />);
    }

    function createProps(appSettings: IAppSettings): IAppSettingsFormProps {
        return {
            appSettings,
            onSubmit: onSubmitHandler,
            onCancel: onCancelHandler,
        };
    }

    it("initializes default state", () => {
        wrapper = createComponent();
        const state = wrapper.state();
        expect(state.appSettings).toEqual(defaultAppSettings);
        expect(state.classNames).toEqual(["needs-validation", "was-validated"]);
        expect(state.formSchema).not.toBeNull();
        expect(state.uiSchema).not.toBeNull();
    });

    it("initializes state with saved app settings", () => {
        const appSettings: IAppSettings = {
            devToolsEnabled: false,
            securityTokens: [
                { name: "A", key: "1" },
                { name: "B", key: "2" },
                { name: "C", key: "3" },
            ],
        };
        const props = createProps(appSettings);
        wrapper = createComponent(props);
        expect(wrapper.state("appSettings")).toEqual(appSettings);
        expect(wrapper.find(".form-row").length).toEqual(appSettings.securityTokens.length);
    });

    it("updates state if app settings change", () => {
        wrapper = createComponent();
        const updatedAppSettings: IAppSettings = {
            devToolsEnabled: false,
            securityTokens: [
                { name: "A", key: "1" },
                { name: "B", key: "2" },
                { name: "C", key: "3" },
            ],
        };

        wrapper.setProps({ appSettings: updatedAppSettings });
        const state = wrapper.state();
        expect(state.appSettings).toEqual(updatedAppSettings);
    });

    it("raises the submit handler on clicking the submit button", async () => {
        wrapper = createComponent();

        await MockFactory.flushUi(() => wrapper.find("form").simulate("submit"));
        expect(onSubmitHandler).toBeCalledWith(defaultAppSettings);
    });

    it("raises cancel event handler on clicking the cancel button", async () => {
        wrapper = createComponent();

        await MockFactory.flushUi(() => wrapper.find(".btn-cancel").simulate("click"));
        expect(onCancelHandler).toBeCalled();
    });
});
