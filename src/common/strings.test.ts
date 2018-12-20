import { strings, addLocValues } from "./strings";
const connectionJson = require("../react/components/pages/connections/connectionForm.json");
const english = require("../common/localization/en.json");

describe("English localization tests", () => {
    it("Replaces values in json", () => {
        const newConnectionJson = addLocValues(connectionJson)
        expect(newConnectionJson.title).toEqual(english.connections.title);
    })
})

// const connectionJson = require("../react/components/pages/connections/connectionForm.json");
