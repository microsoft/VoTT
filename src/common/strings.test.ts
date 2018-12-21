import { strings, addLocValues } from "./strings";


describe("Localization tests", () => {

    const languages = ["en", "es"]

    function getLanguageJson(language: string) {
        // tslint:disable-next-line:no-var-requires
        const languageJson = require(`../common/localization/${language}.json`);
        return languageJson;
    }

    it("Connection Form", () => {
        // tslint:disable-next-line:no-var-requires
        const connectionForm = require("../react/components/pages/connections/connectionForm.json");
        for(const language of languages) {
            const languageJson = getLanguageJson(language);
            strings.setLanguage(language);
            const lConn = languageJson.connections;
            const common = languageJson.common;
            const newConn = addLocValues(connectionForm);
            const connProps = newConn.properties;

            expect(newConn.title).toEqual(lConn.title);
            expect(connProps.name.title).toEqual(common.displayName);
            expect(connProps.description.title).toEqual(common.description);
            expect(connProps.providerType.title).toEqual(lConn.provider);
            expect(connProps.providerType.enumNames[0]).toEqual(lConn.providers.bing.title);
            expect(connProps.providerType.enumNames[1]).toEqual(lConn.providers.local.title);
        }
    })
});
