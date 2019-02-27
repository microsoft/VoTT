import Guard from "../guard";

/**
 * Processes items in the map within the specified batch size (default: 5)
 * @param this The map to process
 * @param action The action to perform on each item in the map
 * @param batchSize The batch size for actions to perform in parallel (default: 5)
 */
export async function forEachAsync<K, V>(
    this: Map<K, V>,
    action: (value: V, key: K) => Promise<void>,
    batchSize: number = 5): Promise<void> {
    Guard.null(this);
    Guard.null(action);
    Guard.expression(batchSize, (value) => value > 0);

    const all: Array<[K, V]> = [...this.entries()];

    while (all.length > 0) {
        const batch: Array<[K, V]> = [];

        while (all.length > 0 && batch.length < batchSize) {
            batch.push(all.pop());
        }

        const tasks = batch.map((item) => action(item[1], item[0]));
        await Promise.all(tasks);
    }
}
