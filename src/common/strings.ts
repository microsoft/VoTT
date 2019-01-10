import LocalizedStrings, { LocalizedStringsMethods } from "react-localization";
import { english } from "./localization/en-us";
import { spanish } from "./localization/es-cl";

export interface IAppStrings {
    appName: string;
    common: {
        displayName: string;
        description: string;
        submit: string;
        cancel: string;
        provider: string;
        homePage: string;
    };
    homePage: {
        newProject: string;
        openLocalProject: {
            title: string;
        }
        openCloudProject: {
            title: string;
            selectConnection: string;
        }
        deleteProject: {
            title: string;
            confirmation: string;
        }
        recentProjects: string;
    };
    appSettings: {
        title: string;
        storageTitle: string;
        uiHelp: string;
        devTools: {
            description: string;
            button: string;
        },
        reload: {
            description: string;
            button: string;
        }
    };
    projectSettings: {
        title: string;
        save: string;
        sourceConnection: {
            title: string;
            description: string;
        }
        targetConnection: {
            title: string;
            description: string;
        }
        addConnection: string;
    };
    tags: {
        title: string;
        placeholder: string;
        editor: string;
        modal: {
            name: string;
            color: string;
        }
        colors: {
            white: string;
            gray: string;
            red: string;
            maroon: string;
            yellow: string;
            olive: string;
            lime: string;
            green: string;
            aqua: string;
            teal: string;
            blue: string;
            navy: string;
            fuschia: string;
            purple: string;
        }
    };
    connections: {
        title: string;
        details: string;
        settings: string;
        instructions: string;
        save: string;
        providers: {
            azureBlob: {
                title: string;
            }
            bing: {
                title: string;
                options: string;
                apiKey: string;
                query: string;
                aspectRatio: {
                    title: string;
                    all: string;
                    square: string;
                    wide: string;
                    tall: string;
                }
            },
            local: {
                title: string;
                folderPath: string;
                selectFolder: string;
                chooseFolder: string;
            },
        }
    };
    editorPage: {
        width: string;
        height: string;
        toolbar: {
            select: string;
            pan: string;
            drawRectangle: string;
            drawPolygon: string;
            saveProject: string;
            exportProject: string;
        }
        assetError: string;
    };
    export: {
        title: string;
        settings: string;
        saveSettings: string;
        providers: {
            vottJson: string;
            azureCV: string;
            tfRecords: string;
            tfPascalVoc: string;
        },
    };
    activeLearning: {
        title: string;
    };
    profile: {
        settings: string;
    };
}

interface IStrings extends LocalizedStringsMethods, IAppStrings { }

export const strings: IStrings = new LocalizedStrings({
    en: english,
    es: spanish,
});

export function addLocValues(json: any) {
    return interpolateJson(json, { strings });
}

export function interpolateJson(json: any, params: any) {
    const template = JSON.stringify(json);
    const outputJson = interpolate(template, params);
    return JSON.parse(outputJson);
}

export function interpolate(template: string, params: any) {
    const names = Object.keys(params);
    const vals = Object["values"](params);
    return new Function(...names, `return \`${template}\`;`)(...vals);
}
