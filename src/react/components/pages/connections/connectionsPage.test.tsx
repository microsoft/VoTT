import React from "react";
import { Provider } from "react-redux";
import { AnyAction, Store } from "redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import createReduxStore from "../../../../redux/store/store";
import initialState from "../../../../redux/store/initialState";
import ConnectionPage, { IConnectionPageProps } from "./connectionsPage";
import IConnectionActions, * as connectionActions from "../../../../redux/actions/connectionActions";

describe("Connections Page", () => {
    function createComponent(store, props: IConnectionPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <ConnectionPage {...props} />
                </Router>
            </Provider>
        );
    }

    describe("without any connections", () => {
        const store = createStore();
        const props = createProps();
        const wrapper = createComponent(store, props);
        let connectionsPage;

        it("isn't null", () => {
            expect(wrapper).not.toBeNull();
        });

        it("mounted the component", () => {
            connectionsPage = wrapper.find(ConnectionPage).childAt(0);
            expect(connectionsPage).not.toBeNull();

            const page = wrapper.find(".app-connections-page");
            expect(page.children().length).toEqual(2);
        });

        it("renders connections list correctly", () => {
            const list = wrapper.find(".app-connections-page-list");
            // not null
            // has "Connections" text
            // has "No items found" text
            // has + button
        });

        it("renders connection details correctly", () => {
            const details = wrapper.find(".app-connections-page-details");
            // not null
            // has "Please select a connection to edit"
            // nothing else
        });
    });

    // TODO test startin page
    // TODO test + button shows details of form
    // TODO submit a new connection works
    // TODO edit mode shows as it should (with set values)
    // TODO update with changes works (and updates existing) (onchange handler is called) (onsubmit handelr was called)
    // TODO delete
    // TODO fix bug, after delete, form shows (add test)
});

function createProps(): IConnectionPageProps {
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
            path: `https://localhost:3000/connections`,
            url: `https://localhost:3000/connections`,
        },
        connections: [],
        actions: (connectionActions as any) as IConnectionActions,
    };
}

function createStore(): Store<any, AnyAction> {
    return createReduxStore(initialState);
}
