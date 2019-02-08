import { ClipBoard } from "./clipboard";

describe("Test ClipBoard", () => {

    it("Get null payload", () => {
        const c = new ClipBoard<string>();
        expect(c.get()).toBeNull();
    });

    it("Set payload", () => {
        const c = new ClipBoard<string>();
        const testString = "Test";
        c.set(testString);
        expect(c.get()).toEqual(testString);
    });

    it("Multiple get payload calls", () => {
        const c = new ClipBoard<string>();
        const testString = "Test";
        c.set(testString);
        expect(c.get()).toEqual(testString);
        expect(c.get()).toEqual(testString);
        expect(c.get()).toEqual(testString);
        expect(c.get()).toEqual(testString);
    });

    it("Pop", () => {
        const c = new ClipBoard<string>();
        const testString = "Test";
        c.set(testString);
        expect(c.get()).toEqual(testString);
        c.pop();
        expect(c.get()).toBeNull();
    });
});
