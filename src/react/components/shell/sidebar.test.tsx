import React from "react";
import Sidebar from "./sidebar";
import { BrowserRouter as Router } from "react-router-dom";
import { mount } from "enzyme";
import { IProject } from "../../../models/applicationState";

describe("Sidebar Component", () => {
    it("renders correctly", () => {
        const project: IProject = null;
        const wrapper = mount(
            <Router>
                <Sidebar project={project} />
            </Router>,
        );

        expect(wrapper).not.toBeNull();

        const links = wrapper.find("ul li");
        expect(links.length).toEqual(7);
    });
});
