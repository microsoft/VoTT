import { Middleware, Dispatch, AnyAction, MiddlewareAPI } from "redux";

export interface ILocalStorageMiddlewareOptions {
    paths: string[];
}

export function createLocalStorage(config: ILocalStorageMiddlewareOptions): Middleware {
    return (store: MiddlewareAPI<Dispatch<AnyAction>>) => (next: Dispatch<AnyAction>) => (action: any) => {
        const result = next(action);
        const state = store.getState();

        config.paths.forEach((path) => {
            if (state[path]) {
                const json = JSON.stringify(state[path]);
                localStorage.setItem(path, json);
            }
        });

        return result;
    };
}

export function mergeInitialState(state: any, paths: string[]) {
    const initialState = { ...state };
    paths.forEach((path) => {
        const json = localStorage.getItem(path);
        if (json) {
            initialState[path] = JSON.parse(json);
        }
    });

    return initialState;
}
