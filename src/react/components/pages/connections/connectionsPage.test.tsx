import React from "react";
import { Provider } from "react-redux";
import { AnyAction, Store } from "redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import createReduxStore from "../../../../redux/store/store";
import initialState from "../../../../redux/store/initialState";
import IConnectionActions, * as connectionActions from "../../../../redux/actions/connectionActions";
import ConnectionPage, { IConnectionPageProps } from "./connectionsPage";
import CondensedList from "../../common/condensedList";
import { Link } from "react-router-dom";

describe("Connections Page", () => {
    function createComponent(store, props: IConnectionPageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <ConnectionPage {...props} />
                </Router>
            </Provider>,
        );
    }

    let wrapper: any = null;
    let connectionsPage: any = null;

    beforeEach(() => {
        wrapper = createComponent(createStore(), createProps());
        expect(wrapper).not.toBeNull();
        connectionsPage = wrapper.find(ConnectionPage);
        expect(connectionsPage.exists()).toBe(true);
    });

    it("mounted the component", () => {
        const page = connectionsPage.find(".app-connections-page");
        expect(page.exists()).toBe(true);
        expect(page.children()).toHaveLength(3);
    });

    describe("without any connections", () => {

        it("renders connections list correctly", () => {
            const wrapper = createComponent(createStore(), createProps());
            const connectionsPage = wrapper.find(ConnectionPage);

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
            const wrapper = createComponent(createStore(), createProps());
            const connectionsPage = wrapper.find(ConnectionPage);

            const text = connectionsPage.find("h6");
            expect(text.exists()).toBe(true);

            // TODO pick up from here ;) (see connectionForm.tsx)
            // TODO: not sure why this doesn't work
            // expect(text.text()).toBe("Please select a connection to edit");
        });
    });

    describe("adding a connection", () => {

        it("opens a form pane when + button is hit", () => {
            const wrapper = createComponent(createStore(), createProps());
            const connectionsPage = wrapper.find(ConnectionPage);

            const list = connectionsPage.find(CondensedList);
            const listButton = list.find(Link);
            listButton.simulate('click');

            expect(handler).toBeCalled();

            // TODO: shows up as it should
            // - get plus button
            // - hit it
            // - validate form shows up
        });

        it("sets form in the state", () => {
            // TODO
            // changing fields works
        });

        it("adds connection when submit is hit", () => {
            // TODO
            // gets added to the right place, view resets correctly?
        });
    });

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
