import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { Provider } from "react-redux";
import createReduxStore from "./store/store";
import initialState from "./store/initialState";
import ApplicationState from "./store/applicationState";

it("renders without crashing", () => {
    const defaultState: ApplicationState = initialState;
    const store = createReduxStore(defaultState);
    const div = document.createElement("div");

    ReactDOM.render(
        <Provider store={store}>
            <App />
        </Provider>, div);
    ReactDOM.unmountComponentAtNode(div);
});
