import MockFactory from "../../common/mockFactory";
import { reducer } from "./authReducer";
import { IAuth } from "../../models/applicationState";
import {signInAction, signOutAction} from "../actions/authActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("Auth Reducer", () => {
    it("Saves auth with new access token", () => {
        const testAuth = MockFactory.createTestAuth();
        const state: IAuth = testAuth;
        const newAuth = MockFactory.createTestAuth("new_auth");
        const action = signInAction(newAuth.accessToken);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
    });

    it("Updates auth with the same access token", () => {
        const testAuth = MockFactory.createTestAuth();
        const state: IAuth = testAuth;
        const updatedAuth = { ...testAuth };
        const action = signInAction(updatedAuth.accessToken);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.accessToken).toEqual(testAuth.accessToken);
    });

    it("Deletes access token from auth by signing out", () => {
        const testAuth = MockFactory.createTestAuth();
        const state: IAuth = testAuth;
        const action = signOutAction();

        const result = reducer(state, action);
        expect(result.accessToken).toEqual(null);
    });

    it("Unknown action performs a noop", () => {
        const state: IAuth = MockFactory.createTestAuth();
        const action = anyOtherAction();

        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
