import { reducer } from "./applicationReducer";
import { IAppSettings } from "../../models/applicationState";
import * as ActionTypes from "../actions/actionTypes";

describe("Application Reducer", () => {
    it("Toggle dev tools sets correct state", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            connection: null,
        };

        const action = {
            type: ActionTypes.TOGGLE_DEV_TOOLS_SUCCESS,
            value: true,
        };

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.devToolsEnabled).toBe(action.value);
    });

    it("Refreshing app clones state", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            connection: null,
        };

        const action = {
            type: ActionTypes.REFRESH_APP_SUCCESS,
        };

        const result = reducer(state, action);
        expect(result).not.toBe(state);
    });

    it("Unknown action performs noop", () => {
        const state: IAppSettings = {
            devToolsEnabled: false,
            connection: null,
        };

        const action = {
            type: "UNKNOWN",
        };

        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
