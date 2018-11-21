import * as ActionTypes from '../actions/actionTypes';
import { IConnection } from "../store/applicationState";

export const reducer = (state: IConnection[] = [], action: any) => {
    switch (action.type) {
        case ActionTypes.LOAD_CONNECTIONS_SUCCESS:
            return [...action.connections];
        case ActionTypes.SAVE_CONNECTION_SUCCESS:
            return [
                { ...action.connection },
                ...state.filter(connection => connection.id !== action.connection.id)
            ];
        case ActionTypes.DELETE_CONNECTION_SUCCESS:
            return [...state.filter(connection => connection.id !== action.connection.id)];
        default:
            return state;
    }
}
