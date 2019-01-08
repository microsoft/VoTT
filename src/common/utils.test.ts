import { randomIntInRange } from "./utils";

describe("Helper functions", () => {
    describe("Random int in range", () => {
        it("generates a random number in range", () => {
            let lower = 0;
            let upper = 100;
            while (lower < upper) {
                for (let i = 0; i < 10; i++) {
                    const result = randomIntInRange(lower, upper);
                    expect(result).toBeGreaterThanOrEqual(lower);
                    expect(result).toBeLessThan(upper);
                }
                lower++;
                upper--;
            }
        });

        it("throws an error with inappropriate values", () => {
            expect(() => randomIntInRange(10, 0)).toThrowError();
        });
    });
});
