import MockFactory from "../../common/mockFactory";
import { reducer } from "./authReducer";
import { IAuth } from "../../models/applicationState";
import {signInAction, signOutAction} from "../actions/authActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("Auth Reducer", () => {
    it("Saves auth with new auth object", () => {
        const testAuth: IAuth = MockFactory.createTestAuth();
        const state: IAuth = testAuth;
        const newAuth: IAuth = MockFactory.createTestAuth("new_auth");
        const action = signInAction(newAuth);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
    });

    it("Updates auth with the same auth object", () => {
        const testAuth: IAuth = MockFactory.createTestAuth();
        const state: IAuth = testAuth;
        const updatedAuth: IAuth = { ...testAuth };
        const action = signInAction(updatedAuth);

        const result = reducer(state, action);
        expect(result).not.toBe(state);
        expect(result.accessToken).toEqual(testAuth.accessToken);
    });

    it("Deletes auth properties from auth state by signing out", () => {
        const testAuth: IAuth = MockFactory.createTestAuth();
        const state: IAuth = testAuth;
        const action = signOutAction();

        const result = reducer(state, action);
        expect(result.accessToken).toEqual(null);
        expect(result.fullName).toEqual(null);
    });

    it("Unknown action performs a noop", () => {
        const state: IAuth = MockFactory.createTestAuth();
        const action = anyOtherAction();

        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
