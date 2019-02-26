import { forEachAsync as arrayForEachAsync, mapAsync } from "./common/extensions/array";
import { forEachAsync as mapForEachAsync } from "./common/extensions/map";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        /**
         * Processes items in the array within the specified batch size (default: 5)
         * @param this The array to process
         * @param action The action to perform on each item in the array
         * @param batchSize The batch size for actions to perform in parallel (default: 5)
         */
        forEachAsync(action: (item: T) => Promise<void>, batchSize?: number): Promise<void>;

        /**
         * Maps items in the array in async batches with the specified action
         * @param this The array to process
         * @param action The transformer action to perform on each item in the array
         * @param batchSize The batch size for actions to perform in parallel (default: 5);
         */
        mapAsync<R>(action: (item: T) => Promise<R>, batchSize?: number): Promise<R[]>;
    }

    // tslint:disable-next-line:interface-name
    interface Map<K, V> {
        /**
         * Processes items in the map within the specified batch size (default: 5)
         * @param this The map to process
         * @param action The action to perform on each item in the map
         * @param batchSize The batch size for actions to perform in parallel (default: 5)
         */
        forEachAsync(action: (value: V, key: K) => Promise<void>, batchSize?: number): Promise<void>;
    }
}

export default function registerMixins() {
    if (!Array.prototype.forEachAsync) {
        Array.prototype.forEachAsync = arrayForEachAsync;
    }

    if (!Array.prototype.mapAsync) {
        Array.prototype.mapAsync = mapAsync;
    }

    if (!Map.prototype.forEachAsync) {
        Map.prototype.forEachAsync = mapForEachAsync;
    }
}
