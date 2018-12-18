import React from "react";
import { Provider } from "react-redux";
import { AnyAction, Store } from "redux";
import { Route, Link, StaticRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import Form from "react-jsonschema-form";
import createReduxStore from "../../../../redux/store/store";
import initialState from "../../../../redux/store/initialState";
import IConnectionActions, * as connectionActions from "../../../../redux/actions/connectionActions";
import ConnectionPage, { IConnectionPageProps } from "./connectionsPage";
import CondensedList from "../../common/condensedList";
import ConnectionForm from "./connectionForm";
import ConnectionItem from "./connectionItem";
import MockFactory from "../../../../common/mockFactory";
import { IApplicationState } from "../../../../models/applicationState";

describe("Connections Page", () => {

    const connectionsRoute: string = "/connections";
    const connectionCreateRoute: string = "/connections/create";

    function createComponent(route, store, props: IConnectionPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router location={route}>
                    <ConnectionPage {...props} />
                </Router>
            </Provider>,
        );
    }

    it("mounted the component", () => {
        const wrapper = createComponent(
            connectionsRoute,
            createStore(),
            createProps(connectionsRoute),
        );

        expect(wrapper).not.toBeNull();

        const connectionsPage = wrapper.find(ConnectionPage);
        expect(connectionsPage.exists()).toBe(true);

        const page = connectionsPage.find(".app-connections-page");
        expect(page.exists()).toBe(true);
        expect(page.children()).toHaveLength(3);
    });

    describe("without any connections", () => {

        it("renders connections list correctly", () => {
            const wrapper = createComponent(
                connectionsRoute,
                createStore(),
                createProps(connectionsRoute),
            );
            const connectionsPage = wrapper.find(ConnectionPage);

            const listRoot = connectionsPage.find("div.app-connections-page-list");
            expect(listRoot.exists()).toBe(true);

            const list = connectionsPage.find(CondensedList);
            const props = list.props();
            expect(props.title).toEqual("Connections");
            expect(props.items).toEqual([]);

            const listButton = list.find(Link);
            expect(listButton.props().to).toEqual(connectionCreateRoute);
        });

        it("renders connection form correctly", () => {
            const wrapper = createComponent(
                connectionsRoute,
                createStore(),
                createProps(connectionsRoute),
            );
            const connectionsPage = wrapper.find(ConnectionPage);

            const route = connectionsPage.find(Route);
            expect(route.last().prop("path")).toEqual("/connections/:connectionId");

            const text = connectionsPage.find("h6");
            expect(text.exists()).toBe(true);

            // TODO: not sure why this doesn't work
            // expect(text.text()).toBe("Please select a connection to edit");
        });
    });

    describe("adding a connection", () => {

        it("create connection button exists", () => {
            const wrapper = createComponent(
                connectionsRoute,
                createStore(),
                createProps(connectionsRoute),
            );
            const connectionsPage = wrapper.find(ConnectionPage);

            const form = connectionsPage.find(ConnectionForm);
            expect(form.exists()).toBe(false);

            const list = connectionsPage.find(CondensedList);
            expect(list.exists()).toBe(true);
            expect(list.props().newLinkTo).toBe(connectionCreateRoute);
        });

        it("ConnectionForm mounts correctly", () => {
            const props = createProps(connectionCreateRoute);
            props.match.params = { connectionId: "create" };

            const wrapper = createComponent(connectionCreateRoute, createStore(), props);
            const connectionsPage = wrapper.find(ConnectionPage);
            const form = connectionsPage.find(ConnectionForm);
            expect(form.exists()).toBe(true);
        });

        it("adds connection when submit button is hit", () => {
            const props = createProps(connectionCreateRoute);
            props.match.params = { connectionId: "create" };

            const saveConnection = jest.spyOn(props.actions, "saveConnection");

            const wrapper = createComponent(connectionCreateRoute, createStore(), props);
            const connectionsPage = wrapper.find(ConnectionPage);
            const connectionForm = connectionsPage.find(ConnectionForm);

            connectionForm.find("input#root_name")
                          .simulate("change", { target: { value: "test" } });
            connectionForm.find("select#root_providerType")
                          .simulate("change", { target: { value: "azureBlobStorage" } });
            connectionForm.find("input#root_providerOptions_connectionString")
                          .simulate("change", { target: { value: "test" } });
            connectionForm.find("input#root_providerOptions_containerName")
                          .simulate("change", { target: { value: "test" } });

            connectionForm.find(Form).simulate("submit");
            connectionForm.update();

            expect(saveConnection).toBeCalled();
        });

        it("renders connections in the list correctly", () => {
            const props = createProps(connectionCreateRoute);

            let state = initialState;
            state.connections = MockFactory.createTestConnections(8);

            const store = createStore(state);

            const wrapper = createComponent(connectionsRoute, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);
            const items = connectionsPage.find(ConnectionItem);

            expect(items.length).toEqual(8);
        });

        // TODO: renders the form correctly when a new connection is selected
        // init with 2
        // ensure no form is drawn
        // select first
        // ensure first form is drawm
        // select second
        // ensure second form is drawn
    });

    describe("removing a connection", () => {

        // TODO delete `connectionPage.props().actions.deleteConnection`
        it("removes connection when delete button is hit", () => {
            // init with 1 connection
            // hit the button
            // make sure 0 connections are in the list or drawn
        });

        // TODO fix bug, after delete, form shows (add test)
        it("stops drawing the form when a connection is removed", () => {
            // init with 1 connection
            // make sure form shows
            // delete it
            // make sure form goes
        });
    });
});

function createProps(route: string): IConnectionPageProps {
    return {
        history: {
            length: 0,
            action: null,
            location: null,
            push: jest.fn(),
            replace: jest.fn(),
            go: jest.fn(),
            goBack: jest.fn(),
            goForward: jest.fn(),
            block: jest.fn(),
            listen: jest.fn(),
            createHref: jest.fn(),
        },
        location: {
            hash: null,
            pathname: null,
            search: null,
            state: null,
        },
        match: {
            params: null,
            isExact: true,
            path: `https://localhost:3000${route}`,
            url: `https://localhost:3000${route}`,
        },
        connections: [],
        actions: (connectionActions as any) as IConnectionActions,
    };
}

function createStore(overrideStore?: IApplicationState): Store<any, AnyAction> {
    return createReduxStore(overrideStore ? overrideStore : initialState);
}
