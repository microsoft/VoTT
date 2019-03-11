import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import CondensedList from "./condensedList";
import { mount } from "enzyme";

const TestComponent = ({ item, onClick, onDelete }) => {
    return (
        <li className="test-component" onClick={onClick}>
            <span>{item.name}</span>
            <button onClick={onDelete}>Delete</button>
        </li>
    );
};

describe("Condensed List Component", () => {
    const items = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" },
        { id: 4, name: "Item 4" },
    ];

    function createList(title: string, items: any[], options): any {
        return mount(
            <Router>
                <CondensedList
                    title={title}
                    Component={TestComponent}
                    items={items}
                    onClick={options.onClick}
                    onDelete={options.onDelete}
                    newLinkTo={options.newLinkTo}
                    displayEmptyMessage={true}
                />
            </Router>,
        );
    }

    it("Displays the correct title", () => {
        const expectedTitle = "Testing Component";
        const wrapper = createList(expectedTitle, items, {});
        const actualTitle = wrapper.find(".condensed-list-header span").text();
        expect(actualTitle).toEqual(expectedTitle);
    });

    it("Displays the add link when defined", () => {
        const expectedNewLinkTo = "/create";
        const wrapper = createList("Testing Component", items, { newLinkTo: expectedNewLinkTo });
        const newLink = wrapper.find(".condensed-list-header a");
        expect(newLink.length).toEqual(1);
        expect(newLink.prop("href")).toEqual(expectedNewLinkTo);
    });

    it("Does not display the add link when not defined", () => {
        const wrapper = createList("Testing Component", items, {});
        const newLink = wrapper.find(".condensed-list-header a");
        expect(newLink.length).toEqual(0);
    });

    it("Displays loading indicator when items hasn't resolved", () => {
        const wrapper = createList("Testing Component", null, {});
        const spinner = wrapper.find(".fa-circle-notch");
        expect(spinner.length).toEqual(1);
    });

    it("Displays no items found when items array is empty", () => {
        const wrapper = createList("Testing Component", [], {});
        const noItemsText = wrapper.find(".text-center").text();
        expect(noItemsText).toEqual("No items found");
    });

    it("Displays a list of items when item array is not empty", () => {
        const wrapper = createList("Testing Component", items, {});
        const itemComonents = wrapper.find(".test-component");
        expect(itemComonents.length).toEqual(items.length);
    });

    it("Calls onClick handler when the first item is clicked on", () => {
        const options = { onClick: jest.fn() };
        const wrapper = createList("Testing Component", items, options);
        wrapper.find(".test-component").first().simulate("click");
        expect(options.onClick).toBeCalledWith(items[0], expect.anything());
    });

    it("Call onClick handler when the specified item is clicked on", () => {
        const options = { onClick: jest.fn() };
        const wrapper = createList("Testing Component", items, options);
        wrapper.find(".test-component").at(1).simulate("click");
        expect(options.onClick).toBeCalledWith(items[1], expect.anything());
    });

    it("Calls onDelete handler when the first item is deleted", () => {
        const options = { onDelete: jest.fn() };
        const wrapper = createList("Testing Component", items, options);
        wrapper.find(".test-component button").first().simulate("click");
        expect(options.onDelete).toBeCalledWith(items[0]);
    });

    it("Calls onDelete handler when a specified item is deleted", () => {
        const options = { onDelete: jest.fn() };
        const wrapper = createList("Testing Component", items, options);
        wrapper.find(".test-component button").at(1).simulate("click");
        expect(options.onDelete).toBeCalledWith(items[1]);
    });
});
