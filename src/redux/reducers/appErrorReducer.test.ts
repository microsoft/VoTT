import { reducer } from "./appErrorReducer";
import { IAppError, ErrorCode } from "../../models/applicationState";
import { clearErrorAction, showErrorAction } from "../actions/appErrorActions";
import { anyOtherAction } from "../actions/actionCreators";
import MockFactory from "../../common/mockFactory";

describe("AppError Reducer", () => {
    let state: IAppError;

    beforeEach( () => {
        state = MockFactory.createAppError();
    });

    it("ShowError discard previous state and return an appError", () => {
        const appError = MockFactory.createAppError(
            ErrorCode.Unknown,
            "Sample Error Title",
            "Sample Error Message",
        );
        const action = showErrorAction(appError);

        const result = reducer(state, action);
        expect(result).not.toEqual(state);
        expect(result).toEqual(appError);
    });

    it("ClearError return null", () => {
        const action = clearErrorAction();

        const result = reducer(state, action);
        expect(result).toBe(null);
    });

    it("Unknown action performs noop", () => {
        const action = anyOtherAction();
        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
