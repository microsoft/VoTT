import React from 'react';
import Navbar from './navbar';
import { BrowserRouter as Router } from 'react-router-dom';
import { shallow, mount } from 'enzyme';

describe('Sidebar Component', () => {
    it('renders correctly', () => {
        const wrapper = mount(
            <Router>
                <Navbar />
            </Router>
        );

        expect(wrapper).not.toBeNull();

        const logo = wrapper.find('.app-navbar-logo ul li a');
        expect(logo.length).toEqual(1);

        const brand = wrapper.find('.app-navbar-brand span');
        expect(brand.text()).toEqual('VoTT');

        const profile = wrapper.find('.app-navbar-menu ul li a')
        expect(profile.length).toEqual(1);
    });
});
