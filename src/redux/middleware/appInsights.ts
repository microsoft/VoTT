import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";
import { trackReduxAction } from "../../telemetry";

export function createAppInsightsLogger(): Middleware {
    return (store: MiddlewareAPI<Dispatch<AnyAction>>) => (next: Dispatch<AnyAction>) => (action: any) => {
        trackReduxAction(action);
        return next(action);
    };
}
