import { combineReducers } from 'redux'
import * as menu from './menuReducer';

export default combineReducers({
    menu: menu.menuReducer
});