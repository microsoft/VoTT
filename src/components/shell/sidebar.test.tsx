import React from 'react';
import Sidebar from './sidebar';
import { BrowserRouter as Router } from 'react-router-dom';
import { shallow, mount } from 'enzyme';

describe('Sidebar Component', () => {
    it('renders correctly', () => {
        const wrapper = mount(
            <Router>
                <Sidebar />
            </Router>
        );

        expect(wrapper).not.toBeNull();

        const links = wrapper.find('ul li a');
        expect(links.length).toEqual(6);
    });
});
