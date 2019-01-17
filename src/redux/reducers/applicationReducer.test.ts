import { reducer } from "./applicationReducer";
import { IAppSettings } from "../../models/applicationState";
import { toggleDevToolsAction, refreshApplicationAction, saveAppSettingsAction } from "../actions/applicationActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("Application Reducer", () => {
    it("Toggle dev tools sets correct state", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            securityTokens: [],
        };

        const action = toggleDevToolsAction(true);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.devToolsEnabled).toBe(action.payload);
    });

    it("Refreshing app clones state", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            securityTokens: [],
        };

        const action = refreshApplicationAction();
        const result = reducer(state, action);
        expect(result).not.toBe(state);
    });

    it("Saves app settings state is persisted", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            securityTokens: [],
        };

        const payload: IAppSettings = {
            devToolsEnabled: false,
            securityTokens: [
                { name: "A", key: "1" },
                { name: "B", key: "2" },
                { name: "C", key: "3" },
            ],
        };

        const action = saveAppSettingsAction(payload);
        const result = reducer(state, action);

        expect(result).not.toBe(state);
        expect(result).toEqual(payload);
    });

    it("Unknown action performs noop", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            securityTokens: [],
        };

        const action = anyOtherAction();
        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
