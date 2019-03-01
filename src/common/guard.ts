export default class Guard {
    /**
     * Validates the string express is not null or empty, otherwise throws an exception
     * @param value - The value to validate
     * @param paramName - The name of the parameter to validate
     * @param message - The error message to return on invalid value
     */
    public static empty(value: string, paramName?: string, message?: string) {
        if ((!!value === false || value.trim().length === 0)) {
            message = message || (`'${paramName || "value"}' cannot be null or empty`);
            throw new Error(message);
        }
    }

    /**
     * Validates the value is not null, otherwise throw an exception
     * @param value - The value to validate
     * @param paramName - The name of the parameter to validate
     * @param message - The error message to return on invalid value
     */
    public static null(value: any, paramName?: string, message?: string) {
        if ((!!value === false)) {
            message = message || (`'${paramName || "value"}' cannot be null or undefined`);
            throw new Error(message);
        }
    }

    /**
     * Validates the value meets the specified expectation, otherwise throws an exception
     * @param value - The value to validate
     * @param predicate - The predicate used for validation
     * @param paramName - The name of the parameter to validate
     * @param message - The error message to return on invalid value
     */
    public static expression<T>(value: T, predicate: (value: T) => boolean, paramName?: string, message?: string) {
        if (!!value === false || !predicate(value)) {
            message = message || (`'${paramName || "value"}' is not a valid value`);
            throw new Error(message);
        }
    }
}
