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
import { IBingImageSearchOptions, BingImageSearchAspectRatio } from "../../../../providers/storage/bingImageSearch"

describe("Connections Page", () => {

    let wrapper: any = null;
    let connectionsPage: any = null;

    function createComponent(route, store, props: IConnectionPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router location={route}>
                    <ConnectionPage {...props} />
                </Router>
            </Provider>,
        );
    }

    function init(path: string, props: any = { }): void {
        wrapper = createComponent(path, createStore(), createProps(path, props));
        expect(wrapper).not.toBeNull();
        connectionsPage = wrapper.find(ConnectionPage);
        expect(connectionsPage.exists()).toBe(true);
    }

    it("mounted the component", () => {
        init("/connections");

        const page = connectionsPage.find(".app-connections-page");
        expect(page.exists()).toBe(true);
        expect(page.children()).toHaveLength(3);
    });

    describe("without any connections", () => {

        it("renders connections list correctly", () => {
            init("/connections");

            const listRoot = connectionsPage.find("div.app-connections-page-list");
            expect(listRoot.exists()).toBe(true);

            const list = connectionsPage.find(CondensedList);
            const props = list.props();
            expect(props.title).toEqual("Connections");
            expect(props.items).toEqual(null);

            const listButton = list.find(Link);
            expect(listButton.props().to).toEqual("/connections/create");
        });

        it("renders connection form correctly", () => {
            init("/connections");

            const route = connectionsPage.find(Route);
            expect(route.last().prop("path")).toEqual("/connections/:connectionId");

            const text = connectionsPage.find("h6");
            expect(text.exists()).toBe(true);

            // TODO: not sure why this doesn't work
            // expect(text.text()).toBe("Please select a connection to edit");
        });
    });

    describe("adding a connection", () => {

        it("create form button exists", () => {
            init("/connections");

            const form = connectionsPage.find(ConnectionForm);
            expect(form.exists()).toBe(false);

            const list = connectionsPage.find(CondensedList);
            expect(list.exists()).toBe(true);
            expect(list.props().newLinkTo).toBe("/connections/create");
        });

        it("ConnectionForm mounts correctly", () => {
            init("/connections/create", { connectionId: "create" });

            const form = connectionsPage.find(ConnectionForm);
            expect(form.exists()).toBe(true);
        });

        fit("editing the form works", () => {
            init("/connections/create", { connectionId: "create" });

            const connectionForm = connectionsPage.find(ConnectionForm);
            const form = connectionForm.find(Form);

            const nameField = form.find("#root_name").first();
            expect(nameField.exists()).toBe(true);

            nameField.simulate("change", { target: { value: "Foo" } });
            expect(connectionForm.state().formData.name).toBe("Foo");

            // simulate setting the provider type
            form.simulate("change", { target: { providerType: "bingImageSearch" } });
            expect(connectionForm.state().formData.providerType).toBe("bingImageSearch");

            // Ensure provider options are set
            const providerOptions = connectionForm.state().formData.providerOptions;
            expect('apiKey' in providerOptions).toBe(true);
            expect('query' in providerOptions).toBe(true);
            expect('aspectRatio' in providerOptions).toBe(true);
        });

        it("adds connection when submit is hit", () => {
            init("/connections/create", { connectionId: "create" });

            const connectionForm = connectionsPage.find(ConnectionForm);
            const form = connectionForm.find(Form);

            form.simulate("change", { target: { name: "Foo" } });
            form.simulate("change", { target: { providerType: "bingImageSearch" } });

            const bingOptions = connectionForm.state().formData.providerOptions as IBingImageSearchOptions;
            bingOptions.apiKey = "key";
            bingOptions.query = "query";
            bingOptions.aspectRatio = BingImageSearchAspectRatio.Square;

            // save the original onSubmit fn
            const formProps = form.props();
            const onSubmit = formProps.onSubmit;
            formProps.onSubmit = jest.fn((form) => onSubmit(form));

            // TODO: does this work?
            form.simulate("submit");
            formProps.onSubmi
            // TODO: ensure it gets put into the connections list? Should I be tracking the test through to the action?

        });
    });

    // TODO delete
    // TODO fix bug, after delete, form shows (add test)
});

function createProps(route: string, params: any): IConnectionPageProps {
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
            params: params,
            isExact: true,
            path: `https://localhost:3000${route}`,
            url: `https://localhost:3000${route}`,
        },
        connections: [],
        actions: (connectionActions as any) as IConnectionActions,
    };
}

function createStore(): Store<any, AnyAction> {
    return createReduxStore(initialState);
}
