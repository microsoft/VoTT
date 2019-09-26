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
import IAuthActions, * as authActions from "../../../../redux/actions/authActions";

describe("Sign In Page", () => {
    function createComponent(
        store: Store<IApplicationState>,
        props: ISignInPageProps = createProps()): ReactWrapper<ISignInPageProps> {
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

    it("gets the information from the API", async () => {
        const auth = MockFactory.createTestAuth("access_token", "John Doe", false);

        jest.spyOn(ApiService, "loginWithCredentials")
            .mockImplementationOnce(() => Promise.resolve({
                data: {
                    access_token: auth.accessToken,
                },
            }));
        jest.spyOn(ApiService, "getCurrentUser")
        .mockImplementationOnce(() => Promise.resolve({
            data: {
                full_name: auth.fullName,
            },
        }));
        jest.spyOn(ApiService, "updateHeader")
        .mockImplementationOnce(() => Promise.resolve({
            data: {
                token: auth.accessToken,
            },
        }));
    });

    it("saves the auth values when the form is submitted and redirect to home", async () => {
        const auth = MockFactory.createTestAuth("access_token", "John Doe", false);
        const store = createStore(auth);
        const props = createProps();
        const signInAction = jest.spyOn(props.actions, "signIn");
        const wrapper = createComponent(store, props);
        const homepageSpy = jest.spyOn(history, "push");

        await MockFactory.flushUi(() => wrapper.find("form").simulate("submit"));
        expect(signInAction).toBeCalledWith(auth);
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

    function createProps(): ISignInPageProps {
        return {
            actions: (authActions as any) as IAuthActions,
            signIn: {
                email: "some@email.com",
                password: "somePassword",
                rememberUser: false,
            },
        };
    }

});
