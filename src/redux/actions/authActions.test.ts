import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import thunk from "redux-thunk";
import initialState from "../store/initialState";
import { IApplicationState } from "../../models/applicationState";
import createMockStore, { MockStoreEnhanced } from "redux-mock-store";
import MockFactory from "../../common/mockFactory";
import * as authActions from "./authActions";
import { ActionTypes } from "./actionTypes";

describe("Auth Redux Actions", () => {
    const appSettings = MockFactory.appSettings();
    let store: MockStoreEnhanced<IApplicationState>;

    beforeEach(() => {
        IpcRendererProxy.send = jest.fn(() => Promise.resolve());
        const middleware = [thunk];
        const mockState: IApplicationState = {
            ...initialState,
            appSettings,
        };
        store = createMockStore<IApplicationState>(middleware)(mockState);
    });

    it("Sign in action dispatches redux action", async () => {
        const authObject = MockFactory.createTestAuth("access_token", "John Doe");
        await authActions.signIn(authObject)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SIGN_IN_SUCCESS,
            payload: authObject,
        });
    });

    it("Sign out action dispatches redux action", async () => {
        await authActions.signOut()(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SIGN_OUT_SUCCESS,
        });
    });
});
