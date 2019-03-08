import Guard from "./guard";
import { IProject, ISecurityToken, IProviderOptions, ISecureString } from "../models/applicationState";
import { encryptObject, decryptObject } from "./crypto";

/**
 * Generates a random integer in provided range
 * @param min Lower bound of random number generation - INCLUSIVE
 * @param max Upper bound of random number generation - EXCLUSIVE
 */
export function randomIntInRange(min: number, max: number) {
    if (min > max) {
        throw new Error(`min (${min}) can't be bigger than max (${max})`);
    }

    if (min === max) {
        return min;
    }

    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

/**
 * Common key codes used throughout application
 */
export const KeyCodes = {
    comma: 188,
    enter: 13,
    backspace: 8,
    ctrl: 17,
    shift: 16,
    tab: 9,
};

/**
 * Generates a query string from the key/values of a JSON object
 * @param object The json object
 * @returns A value representing a URL compatible query string
 */
export function createQueryString(object: any): string {
    Guard.null(object);

    const parts: any[] = [];

    for (const key of Object.getOwnPropertyNames(object)) {
        parts.push(`${key}=${encodeURIComponent(object[key])}`);
    }

    return parts.join("&");
}

/**
 * Encrypts sensitive settings for the specified project and returns the result
 * @param project The project to encrypt
 * @param securityToken The security token used to encrypt the project
 */
export function encryptProject(project: IProject, securityToken: ISecurityToken): IProject {
    const encrypted: IProject = {
        ...project,
        sourceConnection: { ...project.sourceConnection },
        targetConnection: { ...project.targetConnection },
        exportFormat: project.exportFormat ? { ...project.exportFormat } : null,
    };

    encrypted.sourceConnection.providerOptions =
        encryptProviderOptions(project.sourceConnection.providerOptions, securityToken.key);
    encrypted.targetConnection.providerOptions =
        encryptProviderOptions(project.targetConnection.providerOptions, securityToken.key);

    if (encrypted.exportFormat) {
        encrypted.exportFormat.providerOptions =
            encryptProviderOptions(project.exportFormat.providerOptions, securityToken.key);
    }

    return encrypted;
}

/**
 * Decrypts sensitive settings for the specified project and return the result
 * @param project The project to decrypt
 * @param securityToken The security token used to decrypt the project
 */
export function decryptProject(project: IProject, securityToken: ISecurityToken): IProject {
    const decrypted: IProject = {
        ...project,
        sourceConnection: { ...project.sourceConnection },
        targetConnection: { ...project.targetConnection },
        exportFormat: project.exportFormat ? { ...project.exportFormat } : null,
    };

    decrypted.sourceConnection.providerOptions =
        decryptProviderOptions(decrypted.sourceConnection.providerOptions, securityToken.key);
    decrypted.targetConnection.providerOptions =
        decryptProviderOptions(decrypted.targetConnection.providerOptions, securityToken.key);

    if (decrypted.exportFormat) {
        decrypted.exportFormat.providerOptions =
            decryptProviderOptions(decrypted.exportFormat.providerOptions, securityToken.key);
    }

    return decrypted;
}

function encryptProviderOptions(providerOptions: IProviderOptions | ISecureString, secret: string): ISecureString {
    if (!providerOptions) {
        return null;
    }

    if (providerOptions.encrypted) {
        return providerOptions as ISecureString;
    }

    return {
        encrypted: encryptObject(providerOptions, secret),
    };
}

function decryptProviderOptions<T = IProviderOptions>(providerOptions: IProviderOptions | ISecureString, secret): T {
    const secureString = providerOptions as ISecureString;
    if (!(secureString && secureString.encrypted)) {
        return providerOptions as T;
    }

    return decryptObject(providerOptions.encrypted, secret) as T;
}

export function idealTextColor(background: string) {
    const rgb = getRGB(background);
    const bgDelta = (rgb.red * 0.299) + (rgb.green * 0.587) + (rgb.blue * 0.114);
   return ((255 - bgDelta) < 105) ? "#000000" : "#ffffff"; 
}

export function fadedColor(color: string) {
    return color;
}

export function getRGB(background: string) {
    const red = parseInt(background.substr(1, 2), 16);
    const green = parseInt(background.substr(3, 2), 16);
    const blue = parseInt(background.substr(5, 2), 16);
    return {
        red,
        green,
        blue,
    }
}

export function invertColor(hex: string): string {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len?) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}
