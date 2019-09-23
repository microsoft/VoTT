import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import MockFactory from "../../../../common/mockFactory";
import createReduxStore from "../../../../redux/store/store";
import { IApplicationState } from "../../../../models/applicationState";
import { SignInForm } from "./signInForm";
import SignInPage, { ISignInPageProps } from "./signInPage";
import { ReactWrapper, mount } from "enzyme";
import { Store, AnyAction } from "redux";
import { IAuth } from "../../../../models/applicationState";
import history from "../../../../history";

describe("App Settings Page", () => {
    const defaultProps: ISignInPageProps = {
        actions: null,
        signIn: {
            email: null,
            password: null,
            rememberUser: false,
        },
    };

    function createComponent(
        store: Store<IApplicationState>,
        props: ISignInPageProps = null): ReactWrapper<ISignInPageProps> {
        props = props;

        return mount(
            <Provider store={store}>
                <Router>
                    <SignInPage {...props} />
                </Router>
            </Provider>,
        );
    }

    it("renders correctly", () => {
        const store = createStore();
        const wrapper = createComponent(store);
        expect(wrapper.find(SignInForm).length).toEqual(1);
    });

    it("updates values in signIn props when the form is submitted", () => {
        
    });

    it("stores the token in localstorage when the form is submitted", () => {
        expect(localStorage.getItem("token")).toBe("access_token");
    });

    it("saves the auth values when the form is submitted", () => {
        const auth = MockFactory.createTestAuth("access_token", "John Doe", false);
        const store = createStore(auth);
        const wrapper = createComponent(store);
        wrapper.find(SignInForm).find("button#submitCredentials").simulate("click");
    });

    it("displays error message when the credentials are wrong", () => {
    });

    it("redirects to homepage when token is in localstorage", () => {
        const homepageSpy = jest.spyOn(history, "push");
    });

    function createStore(auth: IAuth = null): Store<IApplicationState, AnyAction> {
        const initialState: IApplicationState = {
            currentProject: null,
            appSettings: null,
            connections: [],
            recentProjects: [],
            auth: auth || MockFactory.createTestAuth("access_token", "John Doe", false),
        };

        return createReduxStore(initialState);
    }

});
