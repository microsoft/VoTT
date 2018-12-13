import { applyMiddleware, createStore, Store } from "redux";
import reduxImmutableStateInvarient from "redux-immutable-state-invariant";
import { createLogger } from "redux-logger";
import thunk from "redux-thunk";
import rootReducer from "../reducers";
import { IApplicationState } from "../../models/applicationState";
import { createLocalStorage, mergeInitialState } from "../middleware/localStorage";

export default function createReduxStore(initialState?: IApplicationState): Store {
    const paths: string[] = ["appSettings", "connections", "recentProjects"];

    return createStore(
        rootReducer,
        mergeInitialState(initialState, paths),
        applyMiddleware(
            thunk,
            reduxImmutableStateInvarient(),
            createLogger(),
            createLocalStorage({ paths }),
        ),
    );
}
