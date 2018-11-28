import { applyMiddleware, createStore, Store } from "redux";
import reduxImmutableStateInvarient from "redux-immutable-state-invariant";
import { createLogger } from "redux-logger";
import thunk from "redux-thunk";
import rootReducer from "../reducers";

export default function createReduxStore(initialState: any = undefined): Store {
    return createStore(
        rootReducer,
        initialState,
        applyMiddleware(thunk, reduxImmutableStateInvarient(), createLogger()),
    );
}
