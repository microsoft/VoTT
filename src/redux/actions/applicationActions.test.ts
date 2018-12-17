import createMockStore, { MockStoreEnhanced } from "redux-mock-store";
import { toggleDevToolsAction, refreshApplicationAction } from "./applicationActions";
import { IpcRendererProxy } from "../../common/ipcRendererProxy";
import { ActionTypes } from "./actionTypes";

describe("Application Actions", () => {
    let store: MockStoreEnhanced;

    beforeEach(() => {
        IpcRendererProxy.send = jest.fn(() => Promise.resolve());
        store = createMockStore()();
    });

    it("Toggle Dev Tools action forwards call to IpcRenderer proxy", () => {
        const action = toggleDevToolsAction(true);
        expect(action.type).toEqual(ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS);

        store.dispatch(action);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual(action);

        expect(IpcRendererProxy.send).toBeCalledWith("TOGGLE_DEV_TOOLS", action.payload);
    });

    it("Reload application action forwards call to IpcRenderer proxy", () => {
        const action = refreshApplicationAction();
        expect(action.type).toEqual(ActionTypes.REFRESH_APP_SUCCESS);

        store.dispatch(action);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(action[0]).toEqual(action);

        expect(IpcRendererProxy.send).toBeCalledWith("RELOAD_APP");
    });
});
