import LocalizedStrings, { LocalizedStringsMethods } from "react-localization";
import { replaceVariablesInJson } from "./utils";
const english = require("./localization/en.json");

export interface IStrings extends LocalizedStringsMethods {
    appName: string;
    common: {
        displayName: string;
        description: string;
        submit: string;
        cancel: string;
    };
    homePage: {
        newProject: string;
        openProject: string;
        recentProjects: string;
    };
    projectSettings: {
        sourceConnection: string;
        targetConnection: string;
        addConnection: string;
        tags: string;
    };
    connections: {
        title: string;
        details: string;
        settings: string;
        connectionPageInstructions: string;
        provider: string;
        providers: {
            azureBlob: {
                title: string;
            }
            bing: {
                title: string;
                options: string;
                apiKey: string;
                query: string;
                aspectRatio: string;
            },
            local: {
                title: string;
                folderPath: string;
                selectFolder
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
    };
}

export const strings: IStrings = new LocalizedStrings({
    en: english
});

function getLocValue(variable: string): string {
    const varName = variable.replace(/\${}\s/g, "");
    if (varName.length === 0) {
        throw new Error("Empty variable name");
    }
    const split = varName.split(".");
    let result;
    try {
        result = strings[split[0]];
    } catch (e) {
        throw new Error(`Variable ${varName} not found in strings`);
    }
    for (let i = 1; i < split.length; i++) {
        try {
            result = result[split[i]];
        } catch (e) {
            throw new Error(`Variable ${varName} not found in strings`);
        }
    }
    return result;
}

export function addLocValues(json: any) {
    return replaceVariablesInJson(json, getLocValue);
}
