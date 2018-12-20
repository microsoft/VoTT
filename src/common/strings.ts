import LocalizedStrings, { LocalizedStringsMethods } from "react-localization";

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
    en: {
        appName: "Visual Object Tagging Tool",
        common: {
            displayName: "Display Name",
            description: "Description",
            submit: "Submit",
            cancel: "Cancel",
            zoomIn: "Zoom In",
            zoomOut: "Zoom Out",
        },
        homePage: {
            newProject: "New Project",
            openProject: "Open Project",
            recentProjects: "Recent Projects",
        },
        projectSettings: {
            sourceConnection: "Source Connection",
            targetConnection: "Target Connection",
            addConnection: "Add Connection",
            tags: "Tags",
        },
        connections: {
            title: "Connections",
            settings: "Connection Settings",
            details: "Connection Details",
            connectionPageInstructions: "Please select a connection to edit",
            provider: "Provider",
            providers: {
                azureBlob: {
                    title: "Azure Blob Storage",
                },
                bing: {
                    title: "Bing Image Search",
                    options: "Bing Image Search Options",
                    apiKey: "API Key",
                    query: "Query",
                    aspectRatio: "Aspect Ratio",
                },
                local: {
                    title: "Local File System",
                    folderPath: "Folder Path",
                    selectFolder: "Select Folder",
                },
            },
        },
        editorPage: {
            width: "Width",
            height: "Height",
            toolbar: {
                select: "Select",
                pan: "Pan",
                drawRectangle: "Draw Rectangle",
                drawPolygon: "Draw Polygon",
                saveProject: "Save Project",
                exportProject: "Export Project",
            },
        },
    },
});

function getLocValue(variable: string) {
    const varName = variable.replace(/\${}\s/g, "");
    if (varName.length === 0){
        throw new Error("Empty variable name");
    }
    const split = varName.split(".");
    let result;
    try {
        result = strings[split[0]];
    }
    catch(e) {
        throw new Error(`Variable ${varName} not found in strings`)
    }
    for(let i = 1; i < split.length; i++) {
        try {
            result = result[split[i]];
        }
        catch(e) {
            throw new Error(`Variable ${varName} not found in strings`)
        }
    }
    return result;
}


