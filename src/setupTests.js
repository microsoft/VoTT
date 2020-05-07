import { configure } from 'enzyme';
import 'jest-enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
// Silence console.log and console.group statements in testing
console.log = console.group = function() {};
const electronMock = {
    ipcRenderer: {
        send: jest.fn(),
        on: jest.fn(),
    },
};

window.require = jest.fn(() => electronMock);
