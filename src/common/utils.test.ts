import { randomIntInRange, createQueryString, encryptProject,
    decryptProject, normalizeSlashes, encodeFileURI } from "./utils";
import MockFactory from "./mockFactory";

describe("Helper functions", () => {

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

    describe("Path Utils", () => {

        const path = "C:\\User\\me\\my file.json";
        const normalized = "C:/User/me/my file.json";
        const encoded = "file:C:/User/me/my%20file.json";

        it("Replaces backslashes with forward slashes", () => {
            expect(normalizeSlashes(path)).toEqual(normalized);
            expect(normalizeSlashes(normalized)).toEqual(normalized);
        });

        it("Encodes local file path URI", () => {
            expect(encodeFileURI(path)).toEqual(encoded);
            expect(encodeFileURI(normalized)).toEqual(encoded);

            // Since there are no additional chars to encode, result should be same
            expect(encodeFileURI(path, true)).toEqual(encoded);
            expect(encodeFileURI(normalized, true)).toEqual(encoded);
        });

        it("Encodes additional characters", () => {
            const additional1 = path + "?query=1";
            const expected = encoded + "%3Fquery=1";
            expect(encodeFileURI(additional1, true)).toEqual(expected);

            const additional2 = path + "#t=4";
            const expected2 = encoded + "%23t=4";
            expect(encodeFileURI(additional2, true)).toEqual(expected2);
        });

        it("Generates a query string from an object", () => {
            const params = {
                a: 1,
                b: "A string with a space",
                c: "A string with a # and a & char",
                d: true,
            };

            const result = createQueryString(params);
            expect(result)
                .toEqual(
                    "a=1&b=A%20string%20with%20a%20space&c=A%20string%20with%20a%20%23%20and%20a%20%26%20char&d=true",
                );
        });
    });

    describe("Encryption Utils", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const securityToken = MockFactory.createSecurityToken("TestProject");

        it("encrypt project does not double encrypt project", () => {
            const encryptedProject = encryptProject(testProject, securityToken);
            const doubleEncryptedProject = encryptProject(encryptedProject, securityToken);

            expect(encryptedProject).toEqual(doubleEncryptedProject);
        });

        it("decrypt project does not attempt to decrypt already decrtyped data", () => {
            const decryptedProject = decryptProject(testProject, securityToken);

            expect(decryptedProject).toEqual(testProject);
        });
    });
});
