import { mount, ReactWrapper } from "enzyme";
import React from "react";
import Form from "react-jsonschema-form";
import { Provider } from "react-redux";
import { Link, NavLink, Route, StaticRouter as Router } from "react-router-dom";
import { AnyAction, Store } from "redux";
import MockFactory from "../../../../common/mockFactory";
import { IApplicationState, IConnection } from "../../../../models/applicationState";
import { AssetProviderFactory } from "../../../../providers/storage/assetProviderFactory";
import { IAzureCloudStorageOptions } from "../../../../providers/storage/azureBlobStorage";
import IConnectionActions, * as connectionActions from "../../../../redux/actions/connectionActions";
import initialState from "../../../../redux/store/initialState";
import createReduxStore from "../../../../redux/store/store";
import registerProviders from "../../../../registerProviders";
import CondensedList from "../../common/condensedList/condensedList";
import ConnectionForm from "./connectionForm";
import ConnectionItem from "./connectionItem";
import ConnectionPage, { IConnectionPageProps } from "./connectionsPage";

describe("Connections Page", () => {
    const connectionsRoute: string = "/connections";
    const connectionCreateRoute: string = "/connections/create";

    function createComponent(routerContext, route, store, props: IConnectionPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router location={route} context={routerContext}>
                    <ConnectionPage {...props} />
                </Router>
            </Provider>,
        );
    }

    function createWrapper(
        route = connectionsRoute, store = createStore(), props = createProps(connectionsRoute),
    ): ReactWrapper {
        const context = {};
        return createComponent(context, route, store, props);
    }

    beforeAll(registerProviders);

    it("mounted the component", () => {
        const wrapper = createWrapper();

        expect(wrapper).not.toBeNull();

        const connectionsPage = wrapper.find(ConnectionPage);
        expect(connectionsPage.exists()).toBe(true);

        const page = connectionsPage.find(".app-connections-page");
        expect(page.exists()).toBe(true);
    });

    describe("without any connections", () => {
        it("renders connections list correctly", () => {
            const wrapper = createWrapper();
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
            const wrapper = createWrapper();
            const connectionsPage = wrapper.find(ConnectionPage);

            const route = connectionsPage.find(Route);
            expect(route.last().prop("path")).toEqual("/connections/:connectionId");

            const text = connectionsPage.find(".app-connections-page-detail").childAt(0);
            expect(text.exists()).toBe(true);

            expect(text.text()).toBe("Please select a connection to edit");
        });

        it("renders connections in the list correctly", () => {
            const props = createProps(connectionsRoute);
            const state = { ...initialState };
            state.connections = MockFactory.createTestConnections(8);
            const store = createStore(state);
            const wrapper = createWrapper(connectionsRoute, store, props);

            const connectionsPage = wrapper.find(ConnectionPage);
            const items = connectionsPage.find(ConnectionItem);
            expect(items.length).toEqual(8);
        });
    });

    describe("adding a connection", () => {
        it("create connection button exists", () => {
            const wrapper = createWrapper();
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
            const wrapper = createWrapper(connectionCreateRoute, createStore(), props);

            const connectionsPage = wrapper.find(ConnectionPage);
            const form = connectionsPage.find(ConnectionForm);
            expect(form.exists()).toBe(true);
        });

        it("adds connection when submit button is hit", async (done) => {
            const props = createProps(connectionCreateRoute);
            props.match.params = { connectionId: "create" };

            const saveConnectionSpy = jest.spyOn(props.actions, "saveConnection");
            const wrapper = createWrapper(connectionCreateRoute, createStore(), props);

            const connection: IConnection = {
                ...MockFactory.createTestConnection("test", "azureBlobStorage"),
                id: expect.any(String),
            };

            const assetProvider = MockFactory.createAssetProvider();

            AssetProviderFactory.createFromConnection = jest.fn(() => assetProvider);

            const options: IAzureCloudStorageOptions = connection.providerOptions as IAzureCloudStorageOptions;

            wrapper
                .find("input#root_name")
                .simulate("change", { target: { value: connection.name } });
            wrapper
                .find("textarea#root_description")
                .simulate("change", { target: { value: connection.description } });

            await MockFactory.flushUi(() => {
                wrapper
                    .find("select#root_providerType")
                    .simulate("change", { target: { value: connection.providerType } });
            });

            wrapper.update();

            wrapper
                .find("input#root_providerOptions_accountName")
                .simulate("change", { target: { value: options.accountName } });
            wrapper
                .find("input#root_providerOptions_containerName")
                .simulate("change", { target: { value: options.containerName } });
            wrapper
                .find("input#root_providerOptions_sas")
                .simulate("change", { target: { value: options.sas } });
            wrapper
                .find(Form)
                .simulate("submit");

            setImmediate(() => {
                expect(saveConnectionSpy).toBeCalledWith(connection);
                expect(assetProvider.initialize).toBeCalled();
                done();
            });
        });
    });

    describe("selecting connections", () => {
        it("renders no form when nothing is selected", () => {
            const props = createProps(connectionsRoute);
            const state = { ...initialState };
            state.connections = MockFactory.createTestConnections(2);

            const store = createStore(state);
            const wrapper = createWrapper(connectionsRoute, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);

            expect(connectionsPage.find(ConnectionForm).exists()).toEqual(false);
            expect(connectionsPage.find(ConnectionItem).length).toEqual(2);
            wrapper.unmount();
        });

        it("contains connection specific links for their id /connections/:connectionId", () => {
            const props = createProps(connectionsRoute);
            const state = { ...initialState };
            state.connections = MockFactory.createTestConnections(2);

            const store = createStore(state);
            const wrapper = createWrapper(connectionsRoute, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);
            const items = connectionsPage.find(ConnectionItem);

            expect(items.at(0).find(NavLink).props().to).toEqual("/connections/connection-1");
            expect(items.at(1).find(NavLink).props().to).toEqual("/connections/connection-2");
            wrapper.unmount();
        });

        it("shows the connection's form when its route is visited", () => {
            const route = connectionsRoute + "/connection-3";
            const props = createProps(route);
            props.match.params = { connectionId: "connection-3" };

            const state = { ...initialState };
            state.connections = MockFactory.createTestConnections(4);

            const store = createStore(state);
            const wrapper = createWrapper(route, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);
            const form = connectionsPage.find(ConnectionForm);

            expect(form.exists()).toEqual(true);
            expect(form.props().connection.id).toEqual("connection-3");
            wrapper.unmount();
        });
    });

    describe("removing a connection", () => {
        it("removes unselected connection when deleted button is hit", () => {
            const props = createProps(connectionsRoute);
            const deleteConnection = jest.spyOn(props.actions, "deleteConnection");

            const state = { ...initialState };
            state.connections = MockFactory.createTestConnections(2);

            const store = createStore(state);
            const wrapper = createWrapper(connectionsRoute, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);

            // ensure list is 2 long (drawn & internal)
            const items = connectionsPage.find(ConnectionItem);
            expect(items.length).toEqual(2);

            const toDelete = items.first();
            const deleteButton = toDelete.find(".delete-btn");
            deleteButton.simulate("click");

            // Accept the modal delete warning
            wrapper.find(".modal-footer button").first().simulate("click");

            expect(deleteConnection).toBeCalled();
        });

        it("removes a selected connection when delete button is hit", (done) => {
            const route = connectionsRoute + "/connection-1";
            const props = createProps(route);
            props.match.params = { connectionId: "connection-1" };
            const historyPushSpy = jest.spyOn(props.history, "push");

            const state = { ...initialState };
            state.connections = MockFactory.createTestConnections(2);

            const store = createStore(state);
            const wrapper = createWrapper(route, store, props);
            const connectionsPage = wrapper.find(ConnectionPage);

            const items = connectionsPage.find(ConnectionItem);
            expect(items.length).toEqual(2);

            const form = connectionsPage.find(ConnectionForm);
            expect(form.exists()).toBe(true);

            const toDelete = items.first();
            const deleteButton = toDelete.find(".delete-btn");
            deleteButton.simulate("click");

            // Accept the modal delete warning
            wrapper.find(".modal-footer button").first().simulate("click");

            setImmediate(() => {
                expect(historyPushSpy).toBeCalledWith("/connections");
                expect(connectionsPage.state().connection).toEqual(undefined);
                done();
            });
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
            params: {},
            isExact: true,
            path: `https://localhost:3000${route}`,
            url: `https://localhost:3000${route}`,
        },
        connections: [],
        actions: (connectionActions as any) as IConnectionActions,
    };
}

function createStore(state?: IApplicationState): Store<any, AnyAction> {
    return createReduxStore(state);
}
