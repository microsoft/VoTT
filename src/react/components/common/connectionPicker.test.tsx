import React from "react";
import ConnectionPicker from "./connectionPicker";
import { BrowserRouter as Router } from "react-router-dom";
import { mount } from "enzyme";
import { IConnection } from "../../../models/applicationState";

describe("Connection Picker Component", () => {
    let wrapper: any = null;
    let connections: IConnection[] = null;
    let onChangeHandler: (value: any) => void;

    beforeEach(() => {
        connections = [
            { id: "1", name: "Connection 1", providerType: "localFileSystemProxy", providerOptions: null },
            { id: "2", name: "Connection 2", providerType: "localFileSystemProxy", providerOptions: null },
            { id: "3", name: "Connection 3", providerType: "localFileSystemProxy", providerOptions: null },
            { id: "4", name: "Connection 4", providerType: "localFileSystemProxy", providerOptions: null },
        ];

        onChangeHandler = jest.fn();

        wrapper = mount(
            <Router>
                <ConnectionPicker
                    value={null}
                    connections={connections}
                    onChange={onChangeHandler}
                />
            </Router>,
        );
    });

    it("renders a default 'Select Connection' option", () => {
        const firstOption = wrapper.find("option").first();
        expect(firstOption.text()).toEqual("Select Connection");
    });

    it("renders options from connection props", () => {
        expect(wrapper).not.toBeNull();
        const optionElements = wrapper.find("option");
        expect(optionElements.length).toEqual(connections.length + 1);
        expect(wrapper.prop("value")).not.toBeDefined();
    });

    it("raises onChange event when dropdown is modified", () => {
        const newConnection = connections[1];

        wrapper.find("select").simulate("change", { target: { value: newConnection.id } });
        expect(onChangeHandler).toBeCalledWith(newConnection);
    });
});
