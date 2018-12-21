import { strings, addLocValues, IAppStrings } from "./strings";
import { english } from "./localization/en"
import { spanish } from "./localization/es";

const languages = {
    en: english,
    es: spanish
}

describe("Localization tests", () => {

    function getLanguageJson(language: string) : IAppStrings{
        return languages[language];
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
        const formJson = require("../react/components/pages/appSettings/appSettingsPage.json");
    }

    function testProjectSettingsForm(language: string){
        const languageJson = getLanguageJson(language);
        // tslint:disable-next-line:no-var-requires
        const formJson = require("../react/components/pages/projectSettings/projectForm.json");
        strings.setLanguage(language);
        const newFormJson = addLocValues(formJson)
        const formProps = newFormJson.properties;
        const common = languageJson.common;

        const lProj = languageJson.projectSettings;

        expect(formProps.name.title).toEqual(common.displayName);
        expect(formProps.sourceConnection.title).toEqual(lProj.sourceConnection.title);
        expect(formProps.sourceConnection.description).toEqual(lProj.sourceConnection.description);
        expect(formProps.targetConnection.title).toEqual(lProj.targetConnection.title);
        expect(formProps.targetConnection.description).toEqual(lProj.targetConnection.description);
        expect(formProps.description).toEqual(common.description);
        expect(formProps.tags.title).toEqual(languageJson.tags.title);        
    }

    function testExportForm(language: string){
        const languageJson = getLanguageJson(language);
        // tslint:disable-next-line:no-var-requires
        const formJson = require("../react/components/pages/export/exportForm.json");
        strings.setLanguage(language);
        const newFormJson = addLocValues(formJson)
        const formProps = newFormJson.properties;
        const common = languageJson.common;

        const lExp = languageJson.exportPage;
        
        expect(formProps.providerType.title).toEqual(common.provider);
        expect
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
