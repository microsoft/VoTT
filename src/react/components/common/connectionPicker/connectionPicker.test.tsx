import React from "react";
import { ConnectionPicker, ConnectionPickerWithRouter, IConnectionPickerProps } from "./connectionPicker";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import { mount, ReactWrapper } from "enzyme";
import { IConnection } from "../../../../models/applicationState";

describe("Connection Picker Component", () => {
    let wrapper: any = null;
    let connections: IConnection[] = null;
    let onChangeHandler: (value: any) => void;

    beforeEach(() => {
        connections = MockFactory.createTestConnections();

        onChangeHandler = jest.fn();

        wrapper = mount(
            <Router>
                <ConnectionPickerWithRouter
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

    it("navigates to create connection page when clicking on Add Connection button", () => {
        const connectionPicker = wrapper.find(ConnectionPicker) as ReactWrapper<IConnectionPickerProps>;
        const pushSpy = jest.spyOn(connectionPicker.props().history, "push");
        connectionPicker.find("button.add-connection").simulate("click");
        expect(pushSpy).toBeCalledWith("/connections/create");
    });
});
