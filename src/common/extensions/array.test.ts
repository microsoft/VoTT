import MockFactory from "../mockFactory";
import registerMixins from "../../registerMixins";
import { IAsset } from "../../models/applicationState";

describe("Array Extensions", () => {
    const testArray = MockFactory.createTestAssets(100);

    beforeAll(registerMixins);

    describe("forEachAsync", () => {
        const output = [];

        beforeEach(() => output.length = 0);

        const actionFunc = async (asset): Promise<void> => {
            return new Promise<void>((resolve) => {
                setImmediate(() => {
                    output.push(asset);
                    resolve();
                });
            });
        };

        const sortFunc = (a: IAsset, b: IAsset) => {
            return a.id > b.id ? 1 : (b.id > a.id ? -1 : 0);
        };

        it("processes items in a batches of default size", async () => {
            await testArray.forEachAsync(actionFunc);

            expect(output.sort(sortFunc)).toEqual(testArray.sort(sortFunc));
            expect(output).toHaveLength(testArray.length);
        });

        it("processes items in a batches of 25", async () => {
            await testArray.forEachAsync(actionFunc, 25);

            expect(output.sort(sortFunc)).toEqual(testArray.sort(sortFunc));
            expect(output).toHaveLength(testArray.length);
        });

        it("fails when called with invalid batch size", async () => {
            await expect(testArray.forEachAsync(() => null, 0)).rejects.not.toBeNull();
        });
    });

    describe("mapAsync", () => {
        const mapFunc = async (asset) => {
            return new Promise((resolve) => {
                setImmediate(() => {
                    resolve(asset.id);
                });
            });
        };

        it("processes maps an array in batches of default size", async () => {
            const expected = testArray.map((asset) => asset.id);
            const output = await testArray.mapAsync(mapFunc);

            expect(output.sort()).toEqual(expected.sort());
        });

        it("processes maps an array in batches of 25", async () => {
            const expected = testArray.map((asset) => asset.id);
            const output = await testArray.mapAsync(mapFunc, 25);

            expect(output.sort()).toEqual(expected.sort());
        });

        it("fails when called with invalid batch size", async () => {
            await expect(testArray.mapAsync(() => null, 0)).rejects.not.toBeNull();
        });
    });
});
