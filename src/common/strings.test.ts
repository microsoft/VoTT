import { strings, addLocValues, IAppStrings, interpolate, interpolateJson } from "./strings";
import { english } from "./localization/en-us";
import { spanish } from "./localization/es-cl";

const languages = ["en", "es"];

describe("Localization tests", () => {

    function getLanguageJson(language: string): IAppStrings {
        return {
            en: english,
            es: spanish,
        }[language];
    }

    describe("JSON Form Schemas", () => {
        it("Connection Form", () => {
            for (const language of languages) {
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
            }
        });

        it("App Settings Form", () => {
            for (const language of languages) {
                const languageJson = getLanguageJson(language);
                // tslint:disable-next-line:no-var-requires
                const formJson = require("../react/components/pages/appSettings/appSettingsForm.json");
                strings.setLanguage(language);
                const appSettings = languageJson.appSettings;
                const newFormJson = addLocValues(formJson);
                const formProps = newFormJson.properties;
                const securityTokenProps = formProps.securityTokens.items.properties;

                expect(formProps.securityTokens.title).toEqual(appSettings.securityTokens.title);
                expect(formProps.securityTokens.description).toEqual(appSettings.securityTokens.description);
                expect(securityTokenProps.name.title).toEqual(appSettings.securityToken.name.title);
                expect(securityTokenProps.key.title).toEqual(appSettings.securityToken.key.title);
            }
        });

        it("Export Form", () => {
            for (const language of languages) {
                const languageJson = getLanguageJson(language);
                // tslint:disable-next-line:no-var-requires
                const formJson = require("../react/components/pages/export/exportForm.json");
                strings.setLanguage(language);
                const newFormJson = addLocValues(formJson);
                const formProps = newFormJson.properties;
                const common = languageJson.common;

                const lExp = languageJson.export;

                expect(formProps.providerType.title).toEqual(common.provider);
            }
        });

        it("Project Settings Form", () => {
            for (const language of languages) {
                const languageJson = getLanguageJson(language);
                // tslint:disable-next-line:no-var-requires
                const formJson = require("../react/components/pages/projectSettings/projectForm.json");
                strings.setLanguage(language);
                const newFormJson = addLocValues(formJson);
                const formProps = newFormJson.properties;
                const common = languageJson.common;

                const lProj = languageJson.projectSettings;

                expect(formProps.name.title).toEqual(common.displayName);
                expect(formProps.sourceConnection.title).toEqual(lProj.sourceConnection.title);
                expect(formProps.sourceConnection.description).toEqual(lProj.sourceConnection.description);
                expect(formProps.targetConnection.title).toEqual(lProj.targetConnection.title);
                expect(formProps.targetConnection.description).toEqual(lProj.targetConnection.description);
                expect(formProps.videoSettings.title).toEqual(lProj.videoSettings.title);
                expect(formProps.videoSettings.properties.frameExtractionRate.description).toEqual(
                    lProj.videoSettings.description);
                expect(formProps.videoSettings.properties.frameExtractionRate.title).toEqual(
                    lProj.videoSettings.frameExtractionRate);
                expect(formProps.description.title).toEqual(common.description);
                expect(formProps.tags.title).toEqual(languageJson.tags.title);
            }
        });

        it("Tag Editor Modal Form", () => {
            for (const language of languages) {
                const languageJson = getLanguageJson(language);
                // tslint:disable-next-line:no-var-requires
                const formJson = require("../react/components/common/tagsInput/tagEditorModal/tagEditorModal.json");
                strings.setLanguage(language);
                const newFormJson = addLocValues(formJson);
                const formProps = newFormJson.properties;
                const common = languageJson.common;

                const lTags = languageJson.tags;

                expect(formProps.name.title).toEqual(lTags.modal.name);
                expect(formProps.color.title).toEqual(lTags.modal.color);
                expect(formProps.color.enumNames[0]).toEqual(lTags.colors.white);
                expect(formProps.color.enumNames[1]).toEqual(lTags.colors.gray);
                expect(formProps.color.enumNames[2]).toEqual(lTags.colors.red);
                expect(formProps.color.enumNames[3]).toEqual(lTags.colors.maroon);
                expect(formProps.color.enumNames[4]).toEqual(lTags.colors.yellow);
                expect(formProps.color.enumNames[5]).toEqual(lTags.colors.olive);
                expect(formProps.color.enumNames[6]).toEqual(lTags.colors.lime);
                expect(formProps.color.enumNames[7]).toEqual(lTags.colors.green);
                expect(formProps.color.enumNames[8]).toEqual(lTags.colors.aqua);
                expect(formProps.color.enumNames[9]).toEqual(lTags.colors.teal);
                expect(formProps.color.enumNames[10]).toEqual(lTags.colors.blue);
                expect(formProps.color.enumNames[11]).toEqual(lTags.colors.navy);
                expect(formProps.color.enumNames[12]).toEqual(lTags.colors.fuschia);
                expect(formProps.color.enumNames[13]).toEqual(lTags.colors.purple);
            }
        });
    });

    it("Interpolate processing string template correctly", () => {
        const template = "Hello ${user.name}, my name is ${bot.handle}";
        const params = {
            user: {
                name: "John Doe",
            },
            bot: {
                handle: "VoTT bot",
            },
        };

        const result = interpolate(template, params);
        expect(result).toEqual(`Hello ${params.user.name}, my name is ${params.bot.handle}`);
    });

    it("Interpolate processes a JSON object template correctly", () => {
        const template = {
            user: {
                firstName: "${user.firstName}",
                lastName: "${user.lastName}",
            },
            address: {
                street: "${address.street}",
                city: "${address.city}",
                state: "${address.state}",
                zipCode: "${address.zipCode}",
            },
        };
        const params = {
            user: {
                firstName: "John",
                lastName: "Doe",
            },
            address: {
                street: "1 Microsoft Way",
                city: "Redmond",
                state: "WA",
                zipCode: "98052",
            },
        };

        const result = interpolateJson(template, params);
        expect(result).toEqual(params);
    });
});
