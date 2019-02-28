import Guard from "../guard";

/**
 * Processes items in the array within the specified batch size (default: 5)
 * @param this The array to process
 * @param action The action to perform on each item in the array
 * @param batchSize The batch size for actions to perform in parallel (default: 5)
 */
export async function forEachAsync<T>(
    this: T[],
    action: (item: T) => Promise<void>,
    batchSize: number = 5): Promise<void> {
    Guard.null(this);
    Guard.null(action);
    Guard.expression(batchSize, (value) => value > 0);

    const all: T[] = [...this];

    while (all.length > 0) {
        const batch: T[] = [];

        while (all.length > 0 && batch.length < batchSize) {
            batch.push(all.pop());
        }

        const tasks = batch.map((item) => action(item));
        await Promise.all(tasks);
    }
}

/**
 * Maps items in the array in async batches with the specified action
 * @param this The array to process
 * @param action The transformer action to perform on each item in the array
 * @param batchSize The batch size for actions to perform in parallel (default: 5);
 */
export async function mapAsync<T, R>(
    this: T[],
    action: (item: T) => Promise<R>,
    batchSize: number = 5): Promise<R[]> {
    Guard.null(this);
    Guard.null(action);
    Guard.expression(batchSize, (value) => value > 0);

    let results: R[] = [];
    const all: T[] = [...this];

    while (all.length > 0) {
        const batch: T[] = [];

        while (all.length > 0 && batch.length < batchSize) {
            batch.push(all.pop());
        }

        const tasks = batch.map((item) => action(item));
        const batchResults = await Promise.all(tasks);
        results = results.concat(batchResults);
    }

    return results;
}
