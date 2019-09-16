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

    it("Sign in action forwards call to IpcRenderer proxy and dispatches redux action", async () => {
        const accessToken = MockFactory.createTestAuth("access_token").accessToken;
        await authActions.signIn(accessToken)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SIGN_IN_SUCCESS,
            payload: accessToken,
        });
        expect(IpcRendererProxy.send).toBeCalledWith("SIGN_IN", accessToken);
    });

    it("Sign out action forwards call to IpcRenderer proxy and dispatches redux action", async () => {
        const accessToken = MockFactory.createTestAuth().accessToken;
        await authActions.signOut()(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SIGN_OUT_SUCCESS,
            payload: accessToken,
        });
        expect(IpcRendererProxy.send).toBeCalledWith("SIGN_OUT");
    });
});
