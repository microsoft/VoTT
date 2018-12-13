import { reducer } from "./applicationReducer";
import { IAppSettings } from "../../models/applicationState";
import { toggleDevToolsAction, refreshApplicationAction } from "../actions/applicationActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("Application Reducer", () => {
    it("Toggle dev tools sets correct state", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            connection: null,
        };

        const action = toggleDevToolsAction(true);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.devToolsEnabled).toBe(action.payload);
    });

    it("Refreshing app clones state", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            connection: null,
        };

        const action = refreshApplicationAction();
        const result = reducer(state, action);
        expect(result).not.toBe(state);
    });

    it("Unknown action performs noop", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            connection: null,
        };

        const action = anyOtherAction();
        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
