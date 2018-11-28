import { configure } from 'enzyme';
import 'jest-enzyme';
import Adapter from 'enzyme-adapter-react-16';
import registerProviders from './registerProviders';

configure({ adapter: new Adapter() });
registerProviders();