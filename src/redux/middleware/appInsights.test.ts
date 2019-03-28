import { trackReduxAction } from "../../telemetry";
import { createAppInsightsLogger } from "./appInsights";
jest.mock("../../telemetry");

describe("appInsights middleware", () => {
    const create = () => {
        const appInsightsLogger = createAppInsightsLogger();

        const store = {
            getState: jest.fn(() => ({})),
            dispatch: jest.fn(),
        };

        const next = jest.fn();
        const invoke = (action) => appInsightsLogger(store)(next)(action);

        return { store, next, invoke};
    };

    it("calls trackReduxAction", () => {
        const { invoke } = create();
        const action = { type: "TEST"};
        invoke(action);

        expect(trackReduxAction).toHaveBeenCalledWith(action);
    });

    it("passes through non-function action", () => {
        const { next, invoke } = create();
        const action = { type: "TEST" };
        invoke(action);
        expect(next).toHaveBeenCalledWith(action);
    });
});
