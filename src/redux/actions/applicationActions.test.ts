import createMockStore, { MockStoreEnhanced } from "redux-mock-store";
import thunk from "redux-thunk";
import * as applicationActions from "./applicationActions";
import { ActionTypes } from "./actionTypes";
import { IpcRendererProxy } from "../../common/ipcRendererProxy";

describe("Application Redux Actions", () => {
    let store: MockStoreEnhanced;

    beforeEach(() => {
        IpcRendererProxy.send = jest.fn(() => Promise.resolve());
        const middleware = [thunk];
        store = createMockStore(middleware)();
    });

    it("Toggle Dev Tools action forwards call to IpcRenderer proxy", async () => {
        const payload = true;
        await applicationActions.toggleDevTools(payload)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS,
            payload,
        });

        expect(IpcRendererProxy.send).toBeCalledWith("TOGGLE_DEV_TOOLS", payload);
    });

    it("Reload application action forwards call to IpcRenderer proxy", async () => {
        await applicationActions.reloadApplication()(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.REFRESH_APP_SUCCESS,
        });

        expect(IpcRendererProxy.send).toBeCalledWith("RELOAD_APP");
    });
});
