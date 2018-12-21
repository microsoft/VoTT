import React from "react";
import { mount, ReactWrapper } from "enzyme";
import MockFactory from "../../../../common/mockFactory";
import ConnectionForm, { IConnectionFormProps, IConnectionFormState } from "./connectionForm";

describe("Connection Form", () => {

    let wrapper: any = null;
    let connectionForm: ReactWrapper<IConnectionFormProps, IConnectionFormState> = null;

    function createComponent(props: IConnectionFormProps) {
        return mount(
            <ConnectionForm {...props} />,
        );
    }

    function init(): void {
        wrapper = createComponent({
            connection: MockFactory.createTestConnection("test", "localFileSystemProxy"),
            onSubmit: jest.fn(),
        });

        expect(wrapper).not.toBeNull();
        connectionForm = wrapper.find(ConnectionForm);
        expect(connectionForm.exists()).toBe(true);
    }

    it("should update formData in state when changes occur", (done) => {
        init();
        connectionForm
            .find("input#root_name")
            .simulate("change", { target: { value: "Foo" } });

        setImmediate(() => {
            expect(connectionForm.state().formData.name).toEqual("Foo");
            done();
        });
    });

    it("should update provider options when new type is set", (done) => {
        init();
        connectionForm
            .find("select#root_providerType")
            .simulate("change", { target: { value: "bingImageSearch" } });

        setImmediate(() => {
            expect(connectionForm.state().formData.providerType).toEqual("bingImageSearch");
            const providerOptions = connectionForm.state().formData.providerOptions;
            expect("apiKey" in providerOptions).toBe(true);
            expect("query" in providerOptions).toBe(true);
            expect("aspectRatio" in providerOptions).toBe(true);
            done();
        });
    });
});
