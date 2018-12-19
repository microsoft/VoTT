import createMockStore, { MockStoreEnhanced } from "redux-mock-store";
import { ActionTypes } from "./actionTypes";
import * as connectionActions from "./connectionActions";
import MockFactory from "../../common/mockFactory";
import thunk from "redux-thunk";

describe("Conneciton Redux Actions", () => {
    let store: MockStoreEnhanced;

    beforeEach(() => {
        const middleware = [thunk];
        store = createMockStore(middleware)();
    });
    it("Load Connection action resolves a promise and dispatches redux action", async () => {
        const connection = MockFactory.createTestConnection("Connection1");
        const result = await connectionActions.loadConnection(connection)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.LOAD_CONNECTION_SUCCESS,
            payload: connection,
        });
        expect(result).toEqual(connection);
    });

    it("Save Connection generates unique id for new connection", async () => {
        const connection = MockFactory.createTestConnection("Connection1");
        connection.id = null;

        const result = await connectionActions.saveConnection(connection)(store.dispatch);
        expect(result.id).toEqual(expect.any(String));
    });

    it("Save Connection action resolves a promise and dispatches redux action", async () => {
        const connection = MockFactory.createTestConnection("Connection1");
        const result = await connectionActions.saveConnection(connection)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SAVE_CONNECTION_SUCCESS,
            payload: connection,
        });
        expect(result).toEqual(connection);
    });

    it("Delete connection action resolves an empty promise and dispatches redux action", async () => {
        const connection = MockFactory.createTestConnection("Connection1");
        await connectionActions.deleteConnection(connection)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.DELETE_CONNECTION_SUCCESS,
            payload: connection,
        });
    });
});
