import {randomIntInRange, replaceVariablesInJson} from "./utils";

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

    describe("Replace variables in json", () => {
        const initial = {
            correct: "This is my ${variable.name}.",
            correct2: "${a}",
            noClosing: "This is not ${variable.name.",
            whitespace: "This is not ${variable name}",
            hyphen: "This is not ${variable-name}.",
            underscore: "This is not ${variable_name}",
            justPeriod: "${.}",
        };

        const expected = {
            correct: "This is my CORRECT.",
            correct2: "CORRECT",
            noClosing: "This is not ${variable.name.",
            whitespace: "This is not ${variable name}",
            hyphen: "This is not ${variable-name}.",
            underscore: "This is not ${variable_name}",
            justPeriod: "${.}",
        };

        const mapper = (value: string) => {
            return {
                "variable.name": "CORRECT",
                "a": "CORRECT",
            }[value];
        };

        it("Replaces a variable", () => {
            const result = replaceVariablesInJson(initial, mapper);
            expect(result).toEqual(expected);
        });
    });
});
