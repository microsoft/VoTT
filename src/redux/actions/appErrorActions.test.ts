import * as appErrorActions from "./appErrorActions";
import { ActionTypes } from "./actionTypes";
import { MockStoreEnhanced } from "redux-mock-store";
import thunk from "redux-thunk";
import createMockStore from "redux-mock-store";
import MockFactory from "../../common/mockFactory";

describe("App Error Actions", () => {
    let store: MockStoreEnhanced;

    beforeEach(() => {
        const middleware = [thunk];
        store = createMockStore(middleware)();
    });

    it("Show error dispatches redux action", () => {
        const appError = MockFactory.createAppError();

        appErrorActions.showError(appError)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SHOW_ERROR,
            payload: appError,
        });
    });

    it("Clear error dispatches redux action", () => {
        appErrorActions.clearError()(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.CLEAR_ERROR,
        });
    });
});
