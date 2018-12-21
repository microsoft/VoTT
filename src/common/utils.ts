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
 * Takes a JSON object with variable names of form ${this.is.my.variable}
 * and replaces them with the appropriate values using a provided mapping function
 * @param json JSON object
 * @param valueMapper function that maps variable names to values
 */
export function replaceVariablesInJson(json: any, valueMapper: (variable: string) => string): any {
    let jsonStr = JSON.stringify(json);
    const variableRegex = /\${[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*}/g;
    const variables = jsonStr.match(variableRegex);
    if (variables) {
        for (const variable of variables) {
            const variableName = variable.replace(/\$|{|}/g, "");
            const value = valueMapper(variableName);
            jsonStr = jsonStr.replace(variable, value);
        }
        return JSON.parse(jsonStr);
    } else {
        return json;
    }
}
