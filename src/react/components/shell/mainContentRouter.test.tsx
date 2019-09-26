import { shallow, mount, ReactWrapper } from "enzyme";

import React from "react";
import { StaticRouter as Router } from "react-router-dom";
import SignInPageRoute from "./signInPageRoute";
import AllPagesRoute from "./allPagesRoute";
import { Provider } from "react-redux";
import { AnyAction, Store } from "redux";
import createReduxStore from "../../../redux/store/store";

import MainContentRouter from "./mainContentRouter";
import HomePage, { IHomePageProps } from "./../pages/homepage/homePage";
import SettingsPage from "./../pages/appSettings/appSettingsPage";
import ConnectionsPage from "./../pages/connections/connectionsPage";
import { IApplicationState } from "./../../../models/applicationState";
import SignInPage from "../pages/signIn/signInPage";

describe("Main Content Router", () => {
    const badRoute: string = "/index.html";

    function createComponent(routerContext, route, store, props: IHomePageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router location={route} context={routerContext}>
                    <HomePage {...props} />
                </Router>
            </Provider>,
        );
    }

    function createWrapper(route = badRoute, store = createStore(), props = null): ReactWrapper {
        const context = {};
        return createComponent(context, route, store, props);
    }

    it("renders correct routes when authenticated", () => {
        const wrapper = shallow(<MainContentRouter />);
        const pathMapSignedOut = wrapper.find(AllPagesRoute).reduce((pathMap, route) => {
            const routeProps = route.props();
            pathMap[routeProps.path] = routeProps.component;
            return pathMap;
        }, {});

        const pathMapSignedIn = wrapper.find(SignInPageRoute).reduce((pathMap, route) => {
            const routeProps = route.props();
            pathMap[routeProps.path] = routeProps.component;
            return pathMap;
        }, {});

        expect(pathMapSignedOut["/"]).toBe(HomePage);
        expect(pathMapSignedOut["/settings"]).toBe(SettingsPage);
        expect(pathMapSignedOut["/connections"]).toBe(ConnectionsPage);
        expect(pathMapSignedIn["/sign-in"]).toBe(SignInPage);
    });

    it("renders a redirect when no route is matched", () => {
        const wrapper = createWrapper();

        const homePage = wrapper.find(HomePage);
        expect(homePage.find(".app-homepage").exists()).toEqual(true);
    });
});

function createStore(state?: IApplicationState): Store<any, AnyAction> {
    return createReduxStore(state);
}
