import ConnectionService from "../../services/connectionService";
import { IConnection } from "../../models/applicationState";
import { ActionTypes } from "./actionTypes";
import { IPayloadAction, createPayloadAction } from "./actionCreators";
import { Dispatch } from "redux";

const connectionService = new ConnectionService();

export default interface IConnectionActions {
    loadConnections(): Promise<IConnection[]>;
    loadConnection(connectionId: string): Promise<IConnection>;
    saveConnection(connection: IConnection): Promise<IConnection>;
    deleteConnection(connection: IConnection): Promise<void>;
    closeConnection();
}

export function loadConnection(connectionId: string) {
    return async (dispatch: Dispatch) => {
        try {
            const connection = await connectionService.get(connectionId);
            dispatch(loadConnectionaction(connection));

            return connection;
        } catch (err) {
            throw err;
        }
    };
}

export function loadConnections() {
    return async (dispatch: Dispatch) => {
        const connections = await connectionService.getList();
        dispatch(loadConnectionsAction(connections));

        return connections;
    };
}

export function saveConnection(connection: IConnection) {
    return async (dispatch: Dispatch) => {
        connection = await connectionService.save(connection);
        dispatch(saveConnectionAction(connection));
        dispatch(loadConnectionaction(connection));

        return connection;
    };
}

export function deleteConnection(connection: IConnection) {
    return async (dispatch: Dispatch) => {
        await connectionService.delete(connection);
        dispatch(deleteConnectionAction(connection));
    };
}

export interface ILoadConnectionsAction extends IPayloadAction<string, IConnection[]> {
    type: ActionTypes.LOAD_CONNECTIONS_SUCCESS;
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

export const loadConnectionsAction = createPayloadAction<ILoadConnectionsAction>(ActionTypes.LOAD_CONNECTIONS_SUCCESS);
export const loadConnectionaction = createPayloadAction<ILoadConnectionAction>(ActionTypes.LOAD_CONNECTION_SUCCESS);
export const saveConnectionAction = createPayloadAction<ISaveConnectionAction>(ActionTypes.SAVE_CONNECTION_SUCCESS);
export const deleteConnectionAction =
    createPayloadAction<IDeleteConnectionAction>(ActionTypes.DELETE_CONNECTION_SUCCESS);
