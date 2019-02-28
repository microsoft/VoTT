import { shallow, mount, ReactWrapper } from "enzyme";

import React from "react";
import { Route, StaticRouter as Router } from "react-router-dom";

import { Provider } from "react-redux";
import { AnyAction, Store } from "redux";
import createReduxStore from "../../../redux/store/store";

import MainContentRouter from "./mainContentRouter";
import HomePage, { IHomepageProps } from "./../pages/homepage/homePage";
import SettingsPage from "./../pages/appSettings/appSettingsPage";
import ConnectionsPage from "./../pages/connections/connectionsPage";
import ProfilePage from "./../pages/profileSettingsPage";
import { IApplicationState } from "./../../../models/applicationState";

describe("Main Content Router", () => {
    const badRoute: string = "/index.html";

    function createComponent(routerContext, route, store, props: IHomepageProps): ReactWrapper {
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

    it("renders correct routes", () => {
        const wrapper = shallow(<MainContentRouter />);
        const pathMap = wrapper.find(Route).reduce((pathMap, route) => {
            const routeProps = route.props();
            pathMap[routeProps.path] = routeProps.component;
            return pathMap;
        }, {});

        expect(pathMap["/"]).toBe(HomePage);
        expect(pathMap["/settings"]).toBe(SettingsPage);
        expect(pathMap["/connections"]).toBe(ConnectionsPage);
        expect(pathMap["/profile"]).toBe(ProfilePage);
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
