import _ from "lodash";
import MockFactory from "../mockFactory";
import { IAsset } from "../../models/applicationState";
import registerMixins from "../../registerMixins";

describe("Map Extensions", () => {
    const testArray = MockFactory.createTestAssets(100);

    beforeAll(registerMixins);

    describe("forEachAsync", () => {
        const map = testArray.map((asset) => [asset.id, asset]) as Array<[string, IAsset]>;
        const testMap = new Map<string, IAsset>(map);

        const output = [];

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

        beforeEach(() => output.length = 0);

        it("processes items in batches of default size", async () => {
            await testMap.forEachAsync(actionFunc);
            expect(output.sort(sortFunc)).toEqual(testArray.sort(sortFunc));
        });

        it("processes items in batches of 25", async () => {
            await testMap.forEachAsync(actionFunc, 25);
            expect(output.sort(sortFunc)).toEqual(testArray.sort(sortFunc));
        });

        it("fails when called with invalid batch size", async () => {
            await expect(testMap.forEachAsync(() => null, 0)).rejects.not.toBeNull();
        });
    });
});
