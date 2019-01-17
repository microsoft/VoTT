import { generateKey, encrypt, decrypt } from "./crypto";

describe("Crypto", () => {
    it("generates a key", () => {
        const key = generateKey();
        expect(key).not.toBeNull();
    });

    it("generates a random key without collisions", () => {
        const iterationMap: any = {};

        for (let i = 0; i < 10000; i++) {
            const key = generateKey();
            if (iterationMap[key]) {
                fail("Not unique value generated");
            }
            iterationMap[key] = true;
        }
    });

    it("encrypts & decrypts a value with correct key matches", () => {
        const expected = "Hello, I am a string";
        const secret = generateKey();

        const encrypted = encrypt(expected, secret);
        const decrypted = decrypt(encrypted, secret);

        expect(expected).toEqual(decrypted);
    });

    it("encrypts & decrypts a value with incorrect key does not match", () => {
        const expected = "Hello, I am a string";
        const encryptKey = generateKey();
        const decryptKey = "some random key";

        try {
            const encrypted = encrypt(expected, encryptKey);
            const decrypted = decrypt(encrypted, decryptKey);
            expect(expected).not.toEqual(decrypted);
        } catch (e) {
            expect(e.message).toEqual("Error decrypting data - Malformed UTF-8 data");
        }
    });

    it("encrypts the same value multiple times generates different encrypted data which can both be decrypted", () => {
        const expected = "Hello, I am a string";
        const secret = generateKey();

        // Encryption using a random IV which generates different
        // encrypted values that are still compatibile with the secret
        const encrypted1 = encrypt(expected, secret);
        const encrypted2 = encrypt(expected, secret);

        expect(encrypted1).not.toEqual(encrypted2);

        // Both encrypted values can still be decrypted with the same secret
        const decrypted1 = decrypt(encrypted1, secret);
        const decrypted2 = decrypt(encrypted2, secret);

        expect(decrypted1).toEqual(decrypted2);
    });

    it("encryption fails with malformed message", () => {
        const secret = generateKey();

        expect(() => decrypt("ABC123XYZSDAFASDFS23453", secret)).toThrowError();
    });
});
