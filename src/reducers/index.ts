import { combineReducers } from 'redux'
import * as menu from './applicationReducer';

export default combineReducers({
    appSettings: menu.applicationReducer
});