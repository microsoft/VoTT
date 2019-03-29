import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";
import { trackReduxAction } from "../../telemetry";

/**
 * return a middleware that send custom event to AppInsights tracking redux action
 */
export function createAppInsightsLogger(): Middleware {
    return (store: MiddlewareAPI<Dispatch<AnyAction>>) => (next: Dispatch<AnyAction>) => (action: any) => {
        trackReduxAction(action);
        return next(action);
    };
}
