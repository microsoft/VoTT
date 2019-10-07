import { applyMiddleware, createStore, Store } from "redux";
import thunk from "redux-thunk";
import rootReducer from "../reducers";
import { IApplicationState } from "../../models/applicationState";
import { mergeInitialState } from "../middleware/localStorage";
import { createAppInsightsLogger } from "../middleware/appInsights";
import { Env } from "../../common/environment";
import { composeWithDevTools } from "redux-devtools-extension";

/**
 * Creates initial redux store from initial application state
 * @param initialState - Initial state of application
 * @param useLocalStorage - Whether or not to use localStorage middleware
 */
export default function createReduxStore(
    initialState?: IApplicationState,
    useLocalStorage: boolean = false): Store {
    const paths: string[] = ["appSettings", "connections", "recentProjects", "auth"];

    let middlewares = [thunk, createAppInsightsLogger()];

    if (useLocalStorage) {
        const localStorage = require("../middleware/localStorage");
        const storage = localStorage.createLocalStorage({paths});
        middlewares = [
            ...middlewares,
            storage,
        ];
    }

    if (Env.get() === "development") {
        const logger = require("redux-logger");
        const reduxImmutableStateInvariant = require("redux-immutable-state-invariant");
        middlewares = [
            ...middlewares,
            reduxImmutableStateInvariant.default(),
            logger.createLogger(),
        ];
    }

    const composeEnhancers = composeWithDevTools({
        // options like actionSanitizer, stateSanitizer
    });

    return createStore(
        rootReducer,
        useLocalStorage ? mergeInitialState(initialState, paths) : initialState,
        composeEnhancers(applyMiddleware(...middlewares)),
    );
}
