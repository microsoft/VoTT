import React from "react";
import { Provider } from "react-redux";
import { AnyAction, Store } from "redux";
import { Route, Link, NavLink, StaticRouter as Router } from "react-router-dom";
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

            const text = connectionsPage.find(".app-connections-page-detail").childAt(0);
            expect(text.exists()).toBe(true);

            expect(text.text()).toBe("Please select a connection to edit");
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

            expect(saveConnection).toBeCalled();
            expect(saveConnection.mock.calls[0][0].id !== null).toBe(true);
            wrapper.unmount();
        });

        it("renders connections in the list correctly", () => {
            const props = createProps(connectionsRoute);
            const state = initialState;
            state.connections = MockFactory.createTestConnections(8);

            const store = createStore(state);
            const wrapper = createComponent(connectionsRoute, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);
            const items = connectionsPage.find(ConnectionItem);

            expect(items.length).toEqual(8);
        });
    });

    describe("selecting connections", () => {

        it("renders no form when nothing is selected", () => {
            const props = createProps(connectionsRoute);
            const state = initialState;
            state.connections = MockFactory.createTestConnections(2);

            const store = createStore(state);
            const wrapper = createComponent(connectionsRoute, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);

            expect(connectionsPage.find(ConnectionForm).exists()).toEqual(false);
            expect(connectionsPage.find(ConnectionItem).length).toEqual(2);
        });

        it("contains connection specific links for their id /connections/:connectionId", () => {
            const props = createProps(connectionsRoute);
            const state = initialState;
            state.connections = MockFactory.createTestConnections(2);

            const store = createStore(state);
            const wrapper = createComponent(connectionsRoute, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);
            const items = connectionsPage.find(ConnectionItem);

            expect(items.at(0).find(NavLink).props().to).toEqual("/connections/connection-1");
            expect(items.at(1).find(NavLink).props().to).toEqual("/connections/connection-2");
        });

        it("shows the connection's form when its route is visited", () => {
            const route = connectionsRoute + "/connection-3";
            const props = createProps(route);
            props.match.params = { connectionId: "connection-3" };

            const state = initialState;
            state.connections = MockFactory.createTestConnections(4);

            const store = createStore(state);
            const wrapper = createComponent(route, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);
            const form = connectionsPage.find(ConnectionForm);

            expect(form.exists()).toEqual(true);
            expect(form.props().connection.id).toEqual("connection-3");
        });
    });

    describe("removing a connection", () => {

        it("removes unselected connection when deleted button is hit", () => {
            const props = createProps(connectionsRoute);
            const deleteConnection = jest.spyOn(props.actions, "deleteConnection");

            const state = initialState;
            state.connections = MockFactory.createTestConnections(2);

            const store = createStore(state);
            const wrapper = createComponent(connectionsRoute, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);

            // ensure list is 2 long (drawn & internal)
            const items = connectionsPage.find(ConnectionItem);
            expect(items.length).toEqual(2);

            const toDelete = items.first();
            const deleteButton = toDelete.find(".delete-btn");
            deleteButton.simulate("click");

            expect(deleteConnection).toBeCalled();
        });

        it("removes a selected connection when delete button is hit", () => {
            const route = connectionsRoute + "/connection-1";
            const props = createProps(route);
            props.match.params = { connectionId: "connection-1" };
            const historyPush = jest.spyOn(props.history, "push");

            const state = initialState;
            state.connections = MockFactory.createTestConnections(2);

            const store = createStore(state);
            const wrapper = createComponent(route, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);

            const items = connectionsPage.find(ConnectionItem);
            expect(items.length).toEqual(2);

            const form = connectionsPage.find(ConnectionForm);
            expect(form.exists()).toBe(true);

            const toDelete = items.first();
            const deleteButton = toDelete.find(".delete-btn");
            deleteButton.simulate("click");

            expect(historyPush.mock.calls[0][0]).toEqual("/connections");
            expect(connectionsPage.state().connection).toEqual(undefined);
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
            params: { },
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
