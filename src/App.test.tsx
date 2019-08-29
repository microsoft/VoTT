import React from "react";
import App from "./App";
import { Provider } from "react-redux";
import createReduxStore from "./redux/store/store";
import initialState from "./redux/store/initialState";
import { IApplicationState } from "./models//applicationState";
import { mount } from "enzyme";
import { Router } from "react-router-dom";
import { KeyboardManager } from "./react/components/common/keyboardManager/keyboardManager";
import { ErrorHandler } from "./react/components/common/errorHandler/errorHandler";

describe("App Component", () => {
    const defaultState: IApplicationState = initialState;
    const store = createReduxStore(defaultState);
    const electronMock = {
        ipcRenderer: {
            send: jest.fn(),
            on: jest.fn(),
        },
    };

    beforeAll(() => {
        delete (window as any).require;
    });

    function createComponent() {
        return mount(
            <Provider store={store}>
                <App />
            </Provider>,
        );
    }

    it("renders without crashing", () => {
        createComponent();
    });

    it("renders required top level components", () => {
        const wrapper = createComponent();
        expect(wrapper.find(Router).exists()).toBe(true);
        expect(wrapper.find(KeyboardManager).exists()).toEqual(true);
        expect(wrapper.find(ErrorHandler).exists()).toEqual(true);
    });
});
