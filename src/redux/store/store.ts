import { applyMiddleware, createStore, Store } from "redux";
import reduxImmutableStateInvariant from "redux-immutable-state-invariant";
import { createLogger } from "redux-logger";
import thunk from "redux-thunk";
import rootReducer from "../reducers";
import { IApplicationState } from "../../models/applicationState";
import { createLocalStorage, mergeInitialState } from "../middleware/localStorage";
import { Env } from "../../common/environment";

/**
 * Creates initial redux store from initial application state
 * @param initialState - Initial state of application
 * @param useLocalStorage - Whether or not to use localStorage middleware
 */
export default function createReduxStore(
    initialState?: IApplicationState,
    useLocalStorage: boolean = false): Store {
    const paths: string[] = ["appSettings", "connections", "recentProjects"];

    const middlewares = [];

    if (useLocalStorage) {
        middlewares.push(createLocalStorage({paths}));
    }

    if (Env.get() === "development") {
        middlewares.push(reduxImmutableStateInvariant(), createLogger());
    }

    middlewares.push(thunk);

    return createStore(
        rootReducer,
        useLocalStorage ? mergeInitialState(initialState, paths) : initialState,
        applyMiddleware(...middlewares),
    );
}
