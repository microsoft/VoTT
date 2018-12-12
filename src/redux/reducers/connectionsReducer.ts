import _ from "lodash";
import * as ActionTypes from "../actions/actionTypes";
import { IConnection } from "../../models/applicationState";

export const reducer = (state: IConnection[] = [], action: any): IConnection[] => {
    if (!state) {
        state = [];
    }

    switch (action.type) {
        case ActionTypes.LOAD_CONNECTIONS_SUCCESS:
            const newState = _.unionBy(state, action.connections, (connection) => connection.id);
            localStorage.setItem("connections", JSON.stringify(newState));
            return newState;
        case ActionTypes.SAVE_CONNECTION_SUCCESS:
            return [
                { ...action.connection },
                ...state.filter((connection) => connection.id !== action.connection.id),
            ];
        case ActionTypes.DELETE_CONNECTION_SUCCESS:
            return [...state.filter((connection) => connection.id !== action.connection.id)];
        case ActionTypes.LOAD_PROJECT_SUCCESS:
            const isSourceTargetEqual = action.project.sourceConnection.id === action.project.targetConnection.id;
            if (isSourceTargetEqual) {
                return [
                    { ...action.project.sourceConnection },
                    ...state.filter((connection) => connection.id !== action.project.sourceConnection.id),
                ];
            }

            return [
                { ...action.project.sourceConnection },
                { ...action.project.targetConnection },
                ...state.filter((connection) => {
                    return connection.id !== action.project.sourceConnection.id &&
                        connection.id !== action.project.targetConnection.id;
                })];
        default:
            return state;
    }
};
