import * as ActionTypes from './actionTypes';
import { IConnection } from '../store/applicationState';
import ConnectionService from '../services/connectionService';

const connectionService = new ConnectionService();

export default interface IConnectionActions {
    loadConnections(): Promise<IConnection[]>;
    loadConnection(connectionId: string): Promise<IConnection>;
    saveConnection(connection: IConnection): Promise<IConnection>;
    deleteConnection(connection: IConnection): Promise<void>;
    closeConnection();
}

export function loadConnection(connectionId: string) {
    return async (dispatch) => {
        try {
            const connection = await connectionService.get(connectionId);
            dispatch({ type: ActionTypes.LOAD_CONNECTION_SUCCESS, connection: connection });

            return connection;
        } catch (err) {
            throw err;
        }
    };
}

export function loadConnections() {
    return async (dispatch) => {
        const connections = await connectionService.getList();
        dispatch({ type: ActionTypes.LOAD_CONNECTIONS_SUCCESS, connections: connections });

        return connections;
    }
}

export function saveConnection(connection: IConnection) {
    return async (dispatch) => {
        connection = await connectionService.save(connection);
        dispatch({ type: ActionTypes.SAVE_CONNECTION_SUCCESS, connection: connection });
        dispatch({ type: ActionTypes.LOAD_CONNECTION_SUCCESS, connection: connection });

        return connection;
    };
}

export function deleteConnection(connection: IConnection) {
    return async (dispatch) => {
        await connectionService.delete(connection);
        dispatch({ type: ActionTypes.DELETE_CONNECTION_SUCCESS, connection: connection });
    }
}