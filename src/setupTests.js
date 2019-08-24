import { configure } from 'enzyme';
import 'jest-enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { TextEncoder, TextDecoder } from 'util';

Object.defineProperties(global, {
    TextEncoder: {
        value: TextEncoder,
        writable: true,
        configurable: true,
        enumerable: false
    },
    TextDecoder: {
        value: TextDecoder,
        writable: true,
        configurable: true,
        enumerable: false
    }
});

configure({ adapter: new Adapter() });

// Silence console.log and console.group statements in testing
console.log = console.group = function () { };

const electronMock = {
    ipcRenderer: {
        send: jest.fn(),
        on: jest.fn(),
    },
};

window.require = jest.fn(() => electronMock);
