import { applyMiddleware, createStore, Store } from "redux";
import reduxImmutableStateInvarient from "redux-immutable-state-invariant";
import { createLogger } from "redux-logger";
import thunk from "redux-thunk";
import rootReducer from "../reducers";

export default function createReduxStore(initialState?: any): Store {
    const middleware = window
        ? applyMiddleware(thunk, reduxImmutableStateInvarient(), createLogger())
        : applyMiddleware(thunk);

    return createStore(
        rootReducer,
        initialState,
        middleware,
    );
}
