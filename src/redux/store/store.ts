import { applyMiddleware, createStore, Store } from "redux";
import reduxImmutableStateInvarient from "redux-immutable-state-invariant";
import { createLogger } from "redux-logger";
import thunk from "redux-thunk";
import rootReducer from "../reducers";
import { IApplicationState } from "../../models/applicationState";
import { createLocalStorage, mergeInitialState } from "../middleware/localStorage";

/**
 * Creates initial redux store from initial aplication state
 * @param initialState - Initial state of application
 * @param useLocalStorage - Whether or not to use localStorage middleware
 */
export default function createReduxStore(
    initialState?: IApplicationState,
    useLocalStorage: boolean = false): Store {
    const paths: string[] = ["appSettings", "connections", "recentProjects"];
    const middlewares = useLocalStorage
        ? applyMiddleware(thunk, reduxImmutableStateInvarient(), createLogger(), createLocalStorage({ paths }))
        : applyMiddleware(thunk, reduxImmutableStateInvarient(), createLogger());

    return createStore(
        rootReducer,
        useLocalStorage ? mergeInitialState(initialState, paths) : initialState,
        middlewares,
    );
}
