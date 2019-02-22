import { forEachAsync, mapAsync } from "./common/array";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        /**
         * Processes items in the array within the specified batch size (default: 5)
         * @param this The array to process
         * @param action The action to perform on each item in the array
         * @param batchSize The batch size for actions to perform in parallel (default: 5)
         */
        forEachAsync(action: (item: T) => Promise<void>, batchSize?: number);

        /**
         * Maps items in the array in async batches with the specified action
         * @param this The array to process
         * @param action The transformer action to perform on each item in the array
         * @param batchSize The batch size for actions to perform in parallel (default: 5);
         */
        mapAsync<R>(action: (item: T) => Promise<R>, batchSize?: number);
    }
}

export default function registerMixins() {
    if (!Array.prototype.forEachAsync) {
        Array.prototype.forEachAsync = forEachAsync;
    }

    if (!Array.prototype.mapAsync) {
        Array.prototype.mapAsync = mapAsync;
    }
}
