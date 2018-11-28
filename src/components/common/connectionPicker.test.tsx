import React from 'react';
import ConnectionPicker from './connectionPicker';
import { BrowserRouter as Router } from 'react-router-dom';
import { mount } from 'enzyme';
import { IConnection } from '../../store/applicationState';

describe('Connection Picker Component', () => {
    let wrapper: any = null;
    let connections: IConnection[] = null;

    beforeEach(() => {
        connections = [
            { id: '1', 'name': 'Connection 1', providerType: 'localFileSystemProxy', providerOptions: null },
            { id: '2', 'name': 'Connection 2', providerType: 'localFileSystemProxy', providerOptions: null },
            { id: '3', 'name': 'Connection 3', providerType: 'localFileSystemProxy', providerOptions: null },
            { id: '4', 'name': 'Connection 4', providerType: 'localFileSystemProxy', providerOptions: null },
        ];

        const options = {
            connections: connections
        };

        const onChange = jest.fn();

        wrapper = mount(
            <Router>
                <ConnectionPicker
                    value={null}
                    options={options}
                    onChange={onChange}
                />
            </Router>
        );
    });

    it('renders a default "Select Connection" option', () => {
        const firstOption = wrapper.find('option').first();
        expect(firstOption.text()).toEqual('Select Connection');
    });

    it('renders options from connection props', () => {
        expect(wrapper).not.toBeNull();
        const optionElements = wrapper.find('option');
        expect(optionElements.length).toEqual(connections.length + 1);
        expect(wrapper.prop('value')).not.toBeDefined();
    });
});
