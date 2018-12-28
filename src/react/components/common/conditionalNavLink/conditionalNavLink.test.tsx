import React from "react";
import ConditionalNavLink from "./conditionalNavLink";
import { mount, ReactWrapper } from "enzyme";
import { BrowserRouter as Router } from "react-router-dom";

describe("Conditional Nav Link", () => {
    function createLink(to: string, disabled: boolean, props: any): ReactWrapper {
        return mount(
            <Router>
                <ConditionalNavLink
                    disabled={disabled}
                    to={to}
                    title={props.title}>
                    <i className="fas fa-user" /> /* Example of child components */
                </ConditionalNavLink>
            </Router>,
        );
    }

    it("Renders as a span element when disabled", () => {
        const props = { title: "Test Title" };
        const disabled = true;

        const wrapper = createLink("/test", disabled, props);
        const disabledLink = wrapper.find("span").first();
        expect(disabledLink).not.toBeNull();
        expect(disabledLink.prop("title")).toEqual(props.title);
        const innerElem = disabledLink.find(".fa-user");
        expect(innerElem.length).toEqual(1);
    });

    it("Renders as a anchor element when enabled", () => {
        const props = { title: "Test Title" };
        const disabled = false;
        const expectedHref = "/test";

        const wrapper = createLink(expectedHref, disabled, props);
        const enabledLink = wrapper.find("a").first();
        expect(enabledLink).not.toBeNull();
        expect(enabledLink.prop("href")).toEqual(expectedHref);
        expect(enabledLink.prop("title")).toEqual(props.title);
        const innerElem = enabledLink.find(".fa-user");
        expect(innerElem.length).toEqual(1);
    });
});
