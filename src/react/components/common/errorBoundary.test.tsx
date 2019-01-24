import React from "react";
import ErrorBoundary, { IErrorBoundaryProps } from "./errorBoundary";
import { mount, ReactWrapper } from "enzyme";
import { Provider } from "react-redux";

import { IApplicationState } from "../../../models/applicationState";
import IAppErrorActions, * as appErrorActions from "../../../redux/actions/appErrorActions";
import { AnyAction, Store } from "redux";
import createReduxStore from "../../../redux/store/store";

const ERROR_MSG = "Uncaught Exception from Child Component";

class ChildComponent extends React.Component {
    public render() {
        return <div/>;
    }
}

describe("ErrorBoundary Component", () => {
    function createStore(state?: IApplicationState): Store<any, AnyAction> {
        return createReduxStore(state);
    }

    function createComponent(store, props: IErrorBoundaryProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <ErrorBoundary{...props}>
                    <ChildComponent/>
                </ErrorBoundary>
            </Provider>,
        );
    }

    function createProps(): IErrorBoundaryProps {
        return {
            actions: (appErrorActions as any) as IAppErrorActions,
        };
    }

    it("call showError action when child component throws error", () => {
        const props = createProps();
        const showError = jest.spyOn(props.actions, "showError");

        const wrapper = createComponent(createStore(), props);

        const error = new Error(ERROR_MSG);
        wrapper.find(ChildComponent).simulateError(error);

        expect(showError).toBeCalledWith({ title: "Error", message: ERROR_MSG});
    });

    it("does not render anything when there's an error", () => {
        const props = createProps();
        const wrapper = createComponent(createStore(), props);

        const error = new Error(ERROR_MSG);
        wrapper.find(ChildComponent).simulateError(error);

        const childWrapper = wrapper.find(ChildComponent);
        expect(childWrapper.exists()).toBeFalsy();
    });

    it("render child component when there's no error", () => {
        const props = createProps();
        const wrapper = createComponent(createStore(), props);

        const childWrapper = wrapper.find(ChildComponent);
        expect(childWrapper.exists()).toBeTruthy();
    });
});
