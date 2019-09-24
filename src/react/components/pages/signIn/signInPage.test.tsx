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
import ApiService from "../../../../services/apiService";

jest.mock("react-toastify");

describe("Sign In Page", () => {
    const signIn = jest.fn();
    const defaultProps: ISignInPageProps = {
        actions: {
            signIn,
            signOut: jest.fn(),
        },
        signIn: {
            email: "some@email.com",
            password: "somePassword",
            rememberUser: false,
        },
    };

    function createComponent(
        store: Store<IApplicationState>,
        props: ISignInPageProps = defaultProps): ReactWrapper<ISignInPageProps> {
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
        expect(wrapper.find(SignInForm).exists()).toBe(true);
    });

    it("saves the auth values when the form is submitted", async () => {
        const auth = MockFactory.createTestAuth("access_token", "John Doe", false);
        const store = createStore();
        const wrapper = createComponent(store);
        const homepageSpy = jest.spyOn(history, "push");
        const localStorageSpy = jest.spyOn(Storage.prototype, "setItem");

        jest.spyOn(ApiService, "loginWithCredentials")
            .mockImplementationOnce(() => Promise.resolve({
                data: {
                    access_token: auth.accessToken,
                },
            }));

        expect(localStorageSpy).toBeCalled();

        jest.spyOn(ApiService, "getCurrentUser")
            .mockImplementationOnce(() => Promise.resolve({
                data: {
                    full_name: auth.fullName,
                },
            }));
        await wrapper.find(SignInForm).props().onSubmit(defaultProps.signIn);
        /*
        jest.spyOn(defaultProps.actions, "signIn")
            .mockImplementationOnce(() => Promise.resolve({
                data: {
                    auth,
                },
            }));
        */
        await signIn(auth);
        expect(signIn).toHaveBeenCalledWith(auth);
        expect(store.getState().auth).not.toBeNull();
        expect(homepageSpy).toBeCalled();
    });

    function createStore(auth: IAuth = null): Store<IApplicationState, AnyAction> {
        const initialState: IApplicationState = {
            currentProject: null,
            appSettings: null,
            connections: [],
            recentProjects: [],
            auth,
        };

        return createReduxStore(initialState);
    }

});
