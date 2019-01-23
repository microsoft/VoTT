import { enc, lib, AES } from "crypto-js";
import Guard from "./guard";

/**
 * Generates a random base64 encoded key to be used for encryption
 * @param keySize The key size to use, defaults to 32bit
 */
export function generateKey(keySize: number = 32): string {
    return lib.WordArray.random(keySize).toString(enc.Base64);
}

/**
 * Encrypts the specified message with the provided key
 * @param message The message to encrypt
 * @param secret The base64 encoded secret
 */
export function encrypt(message: string, secret: string): string {
    Guard.emtpy(message);
    Guard.emtpy(secret);

    try {
        const secretBytes = enc.Base64.parse(secret);
        const iv = lib.WordArray.random(24);
        const encrypted = AES.encrypt(message, secretBytes, { iv });
        const json = {
            ciphertext: encrypted.ciphertext.toString(),
            iv: iv.toString(),
        };
        const words = enc.Utf8.parse(JSON.stringify(json));

        return enc.Base64.stringify(words);
    } catch (e) {
        throw new Error(`Error encrypting data - ${e.message}`);
    }
}

/**
 * Encryptes a javascript object with the specified key
 * @param message - The javascript object to encrypt
 * @param secret - The secret to encrypt the message
 */
export function encryptObject(message: any, secret: string): string {
    Guard.null(message);

    return encrypt(JSON.stringify(message), secret);
}

/**
 * Decrypts the specified message with the provided key
 * @param encodedMessage The base64 encoded encrypted data
 * @param secret The base64 encoded secret
 */
export function decrypt(encodedMessage: string, secret: string): string {
    Guard.emtpy(encodedMessage);
    Guard.emtpy(secret);

    try {
        const secretBytes = enc.Base64.parse(secret);
        const json = enc.Base64.parse(encodedMessage).toString(enc.Utf8);
        const params = JSON.parse(json);
        const iv = enc.Hex.parse(params.iv);
        const cipherParams = lib.CipherParams.create({
            ciphertext: enc.Hex.parse(params.ciphertext),
            iv: enc.Hex.parse(params.iv),
        });
        const decrypted = AES.decrypt(cipherParams, secretBytes, { iv });

        return decrypted.toString(enc.Utf8);
    } catch (e) {
        throw new Error(`Error decrypting data - ${e.message}`);
    }
}
/**
 * Decryptes a javascript object with the specified key
 * @param message - The encrypted base64 encded message
 * @param secret - The secret to decrypt the message
 */
export function decryptObject<T = any>(encodedMessage: string, secret: string): T {
    const json = decrypt(encodedMessage, secret);
    return JSON.parse(json) as T;
}
