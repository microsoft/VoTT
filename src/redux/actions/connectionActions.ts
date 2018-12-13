import { IConnection } from "../../models/applicationState";
import { ActionTypes } from "./actionTypes";
import { IPayloadAction, createPayloadAction } from "./actionCreators";
import { Dispatch } from "redux";

export default interface IConnectionActions {
    loadConnection(connection: IConnection): Promise<IConnection>;
    saveConnection(connection: IConnection): Promise<IConnection>;
    deleteConnection(connection: IConnection): Promise<void>;
}

export function loadConnection(connection: IConnection) {
    return (dispatch: Dispatch) => {
        dispatch(loadConnectionaction(connection));
        return Promise.resolve(connection);
    };
}

export function saveConnection(connection: IConnection) {
    return (dispatch: Dispatch) => {
        dispatch(saveConnectionAction(connection));
        return Promise.resolve(connection);
    };
}

export function deleteConnection(connection: IConnection) {
    return (dispatch: Dispatch) => {
        dispatch(deleteConnectionAction(connection));
        return Promise.resolve();
    };
}

export interface ILoadConnectionAction extends IPayloadAction<string, IConnection> {
    type: ActionTypes.LOAD_CONNECTION_SUCCESS;
}

export interface ISaveConnectionAction extends IPayloadAction<string, IConnection> {
    type: ActionTypes.SAVE_CONNECTION_SUCCESS;
}

export interface IDeleteConnectionAction extends IPayloadAction<string, IConnection> {
    type: ActionTypes.DELETE_CONNECTION_SUCCESS;
}

export const loadConnectionaction = createPayloadAction<ILoadConnectionAction>(ActionTypes.LOAD_CONNECTION_SUCCESS);
export const saveConnectionAction = createPayloadAction<ISaveConnectionAction>(ActionTypes.SAVE_CONNECTION_SUCCESS);
export const deleteConnectionAction =
    createPayloadAction<IDeleteConnectionAction>(ActionTypes.DELETE_CONNECTION_SUCCESS);
