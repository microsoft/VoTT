/**
 * Generates a random integer in provided range
 * @param min Lower bound of random number generation - INCLUSIVE
 * @param max Upper bound of random number generation - EXCLUSIVE
 */
export function randomIntInRange(min, max) {
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
