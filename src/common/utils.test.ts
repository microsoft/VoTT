import * as utils from "./utils";

describe("Helper functions", () => {
    it("generates a random number in range", () => {
        let lower = 0;
        let upper = 1000;
        while (lower < upper) {
            for (let i = 0; i < 100; i++) {
                const result = utils.randomIntInRange(lower, upper);
                expect(result).toBeGreaterThanOrEqual(lower);
                expect(result).toBeLessThan(upper);
            }
            lower++;
            upper--;
        }
    });
});
