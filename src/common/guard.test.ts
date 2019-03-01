import Guard from "./guard";

describe("Guard", () => {
    function methodWithRequiredName(name: string) {
        Guard.empty(name);
    }

    function methodWithRequiredNameWithParam(name: string) {
        Guard.empty(name, "name", "Name is required");
    }

    function methodWithRequiredObject(options: any) {
        Guard.null(options);
    }

    function methodWithRequiredExpression(value: number) {
        Guard.expression(value, (num) => num > 0 && num < 100);
    }

    describe("empty", () => {
        it("throws error on null value", () => {
            expect(() => methodWithRequiredName(null)).toThrowError();
        });

        it("throws error on empty value", () => {
            expect(() => methodWithRequiredName("")).toThrowError();
        });

        it("throw error on whitespace", () => {
            expect(() => methodWithRequiredName(" ")).toThrowError();
        });

        it("does not throw error on valid value", () => {
            expect(() => methodWithRequiredName("valid")).not.toThrowError();
        });

        it("throws specific error message", () => {
            expect(() => methodWithRequiredNameWithParam(null)).toThrowError("Name is required");
        });
    });

    describe("null", () => {
        it("throws error on null value", () => {
            expect(() => methodWithRequiredObject(null)).toThrowError();
        });

        it("does not throw error on valid value", () => {
            expect(() => methodWithRequiredObject({})).not.toThrowError();
        });
    });

    describe("expression", () => {
        it("throws error on invalide value", () => {
            expect(() => methodWithRequiredExpression(0)).toThrowError();
        });

        it("does not throw error on valid value", () => {
            expect(() => methodWithRequiredExpression(1)).not.toThrowError();
        });
    });
});
