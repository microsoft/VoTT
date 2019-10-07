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
import ITrackingActions, * as trackingActions from "../../../../redux/actions/trackingActions";

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

    it("saves the auth values when the form is submitted and redirect to home", async () => {
        const auth = MockFactory.createTestAuth("access_token", null, false, null);
        const store = createStore(auth);
        const props = createProps();
        const userInfo: authActions.IUserInfo = { fullName: "John Doe", userId: 2 };
        const signInAction = jest.spyOn(props.actions, "signIn");
        const saveUserInfoAction = jest.spyOn(props.actions, "saveUserInfo");
        const trackingSignInAction = jest.spyOn(props.trackingActions, "trackingSignIn");
        const wrapper = createComponent(store, props);
        const homepageSpy = jest.spyOn(history, "push");
        MockApiCalls(auth.accessToken, userInfo);
        await MockFactory.flushUi(() => wrapper.find("form").simulate("submit"));
        expect(signInAction).toBeCalledWith(auth);
        expect(saveUserInfoAction).toBeCalledWith(userInfo);
        expect(trackingSignInAction).toBeCalledWith(userInfo.userId);
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
            trackingActions: (trackingActions as any) as ITrackingActions,
        };
    }

    function MockApiCalls(accessToken: string = null, userInfo: authActions.IUserInfo) {
        jest.spyOn(ApiService, "loginWithCredentials")
            .mockImplementationOnce(() => Promise.resolve({
                data: {
                    access_token: accessToken,
                },
            }));
        jest.spyOn(ApiService, "getCurrentUser")
            .mockImplementationOnce(() => Promise.resolve({
                data: {
                    full_name: userInfo.fullName,
                    id: userInfo.userId,
                },
            }));
    }
});
