import { strings, addLocValues } from "./strings";

describe("Localization tests", () => {

    function getLanguageJson(language: string) {
        // tslint:disable-next-line:no-var-requires
        const languageJson = require(`../common/localization/${language}.json`);
        return languageJson;
    }

    function testConnectionForm(language: string) {
        const languageJson = getLanguageJson(language);

        // tslint:disable-next-line:no-var-requires
        const formJson = require("../react/components/pages/connections/connectionForm.json");
        strings.setLanguage(language);
        const lConn = languageJson.connections;
        const common = languageJson.common;
        const newFormJson = addLocValues(formJson);
        const formProps = newFormJson.properties;

        expect(newFormJson.title).toEqual(lConn.title);
        expect(formProps.name.title).toEqual(common.displayName);
        expect(formProps.description.title).toEqual(common.description);
        expect(formProps.providerType.title).toEqual(common.provider);
        expect(formProps.providerType.enumNames[0]).toEqual(lConn.providers.bing.title);
        expect(formProps.providerType.enumNames[1]).toEqual(lConn.providers.local.title);
    }

    function testAppSettingsForm(language: string){
        const languageJson = getLanguageJson(language);
        // tslint:disable-next-line:no-var-requires
        const formJson = require("../react/components/pages/connections/connectionForm.json");
    }

    function testProjectSettingsForm(language: string){
        
    }

    function testExportForm(language: string){
        
    }

    function testTagEditorModalForm(language: string){
        
    }

    describe("English", () => {
        const language = "en";
        describe("JSON Schemas", () => {
            fit("Connection Form", () => {
                testConnectionForm(language);
            });
    
            it("App Settings Form", () => {
                testAppSettingsForm(language);
            });
    
            it("Export Form", () => {
                testExportForm(language);
            });
    
            it("Project Settings Form", () => {
                testProjectSettingsForm(language);
            });
    
            it("Tag Editor Modal Form", () => {
                testTagEditorModalForm(language);
            });
        });
    })
    describe("Spanish", () => {
        const language = "es";
        describe("JSON Schemas", () => {
            fit("Connection Form", () => {
                testConnectionForm(language);
            });
    
            it("App Settings Form", () => {
                testAppSettingsForm(language);
            });
    
            it("Export Form", () => {
                testExportForm(language);
            });
    
            it("Project Settings Form", () => {
                testProjectSettingsForm(language);
            });
    
            it("Tag Editor Modal Form", () => {
                testTagEditorModalForm(language);
            });
        });
    })

});
