import { IAppStrings } from "../strings";

/**
 * App Strings for English language
 */
export const english: IAppStrings = {
    appName: "Visual Object Tagging Tool",
    common: {
        displayName: "Display Name",
        description: "Description",
        submit: "Submit",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        provider: "Provider",
        homePage: "Home Page",
    },
    homePage: {
        newProject: "New Project",
        openLocalProject: {
            title: "Open Local Project",
        },
        openCloudProject: {
            title: "Open Cloud Project",
            selectConnection: "Select a Connection",
        },
        recentProjects: "Recent Projects",
        deleteProject: {
            title: "Delete Project",
            confirmation: "Are you sure you want to delete project",
        },
        importProject: {
            title: "Import Project",
            confirmation: "Are you sure you want to convert project ${project.file.name} project settings" +
                "to v2 format? We recommend you backup the project file first.",
        },
    },
    appSettings: {
        title: "Application Settings",
        storageTitle: "Storage Settings",
        uiHelp: "Where your settings are stored",
        save: "Save Settings",
        securityToken: {
            name: {
                title: "Name",
            },
            key: {
                title: "Key",
            },
        },
        securityTokens: {
            title: "Security Tokens",
            description: "Security tokens are used to encrypt sensitive data within your project configuration",
        },
        version: {
            description: "Version:",
        },
        devTools: {
            description: "Open application developer tools to help diagnose issues",
            button: "Toggle Developer Tools",
        },
        reload: {
            description: "Reload the app discarding all current changes",
            button: "Refresh Application",
        },
        messages: {
            saveSuccess: "Successfully saved application settings",
        },
    },
    projectSettings: {
        title: "Project Settings",
        securityToken: {
            title: "Security Token",
            description: "Used to encrypt sensitive data within project files",
        },
        save: "Save Project",
        sourceConnection: {
            title: "Source Connection",
            description: "Where to load assets from",
        },
        targetConnection: {
            title: "Target Connection",
            description: "Where to save the project and exported data",
        },
        videoSettings: {
            title: "Video Settings",
            description: "The rate at which frames are extracted for tagging.",
            frameExtractionRate: "Frame Extraction Rate (frames per a video second)",
        },
        addConnection: "Add Connection",
        messages: {
            saveSuccess: "Successfully saved ${project.name} project settings",
        },
    },
    projectMetrics: {
        title: "Project Metrics",
        sourceAssetsCount: "Number of source assets",
        visitedAssetsCount: "Number of visited assets",
        taggedAssetsCount: "Number of tagged assets",
        regionsCount: "Number of regions drawn",
        tagCategories: "Number of tag categories",
        tagCount: "Per tag totals (number of instances of that tag)",
        averageTagPerTaggedAsset: "Average tags per tagged asset",
    },
    tags: {
        title: "Tags",
        placeholder: "Add new tag",
        editor: "Tags Editor",
        modal: {
            name: "Tag Name",
            color: "Tag Color",
        },
        colors: {
            white: "White",
            gray: "Gray",
            red: "Red",
            maroon: "Maroon",
            yellow: "Yellow",
            olive: "Olive",
            lime: "Lime",
            green: "Green",
            aqua: "Aqua",
            teal: "Teal",
            blue: "Blue",
            navy: "Navy",
            fuschia: "Fuschia",
            purple: "Purple",
        },
    },
    connections: {
        title: "Connections",
        details: "Connection Details",
        settings: "Connection Settings",
        instructions: "Please select a connection to edit",
        save: "Save Connection",
        providers: {
            azureBlob: {
                title: "Azure Blob Storage",
            },
            bing: {
                title: "Bing Image Search",
                options: "Bing Image Search Options",
                apiKey: "API Key",
                query: "Query",
                aspectRatio: {
                    title: "Aspect Ratio",
                    all: "All",
                    square: "Square",
                    wide: "Wide",
                    tall: "Tall",
                },
            },
            local: {
                title: "Local File System",
                folderPath: "Folder Path",
                selectFolder: "Select Folder",
                chooseFolder: "Choose Folder",
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
        videoPlayer: {
            previousTaggedFrame: {
                tooltip: "Previous Tagged Frame",
            },
            nextTaggedFrame: {
                tooltip: "Next Tagged Frame",
            },
            previousExpectedFrame: {
                tooltip: "Previous Frame",
            },
            nextExpectedFrame: {
                tooltip: "Next Frame",
            },
        },
        assetError: "Unable to display asset",
    },
    export: {
        title: "Export",
        settings: "Export Settings",
        saveSettings: "Save Export Settings",
        providers: {
            common: {
                properties: {
                    assetState: {
                        title: "Asset State",
                        description: "Which assets to include in the export",
                        options: {
                            all: "All Assets",
                            visited: "Only Visited Assets",
                            tagged: "Only tagged Assets",
                        },
                    },
                },
            },
            vottJson: {
                displayName: "VoTT JSON",
            },
            azureCV: {
                displayName: "Azure Custom Vision Service",
                properties: {
                    apiKey: {
                        title: "API Key",
                    },
                    classificationType: {
                        title: "Classification Type",
                        options: {
                            multiLabel: "Multiple tags per image",
                            multiClass: "Single tag per image",
                        },
                    },
                    name: {
                        title: "Project Name",
                    },
                    description: {
                        title: "Project Description",
                    },
                    domainId: {
                        title: "Domain",
                    },
                    newOrExisting: {
                        title: "New or Existing Project",
                        options: {
                            new: "New Project",
                            existing: "Existing Project",
                        },
                    },
                    projectId: {
                        title: "Project Name",
                    },
                    projectType: {
                        title: "Project Type",
                        options: {
                            classification: "Classification",
                            objectDetection: "Object Detection",
                        },
                    },
                },
            },
            tfRecords: {
                displayName: "Tensorflow Records",
            },
            tfPascalVoc: {
                displayName: "Tensorflow Pascal VOC",
            },
        },
        messages: {
            saveSuccess: "Successfully saved export settings",
        },
    },
    activeLearning: {
        title: "Active Learning",
    },
    profile: {
        settings: "Profile Settings",
    },
    errors: {
        unknown: {
            title: "Unknown Error",
            message: "The app encountered an unknown error. Please try again.",
        },
        projectUploadError: {
            title: "Error Uploading File",
            message: `There was an error uploading the file.
                Please verify the file is of the correct format and try again.`,
        },
        genericRenderError: {
            title: "Error Loading Application",
            message: "An error occured while rendering the application. Please try again",
        },
        projectInvalidSecurityToken: {
            title: "Error loading project file",
            message: `The security token referenced by the project is invalid.
                Verify that the security token for the project has been set correctly within your application settings`,
        },
        projectInvalidJson: {
            title: "Error parsing project file",
            message: "The selected project files does not contain valid JSON. Please check the file any try again.",
        },
        projectDeleteError: {
            title: "Error deleting project",
            message: `An error occured while deleting the project.
                Validate the project file and security token exist and try again`,
        },
        securityTokenNotFound: {
            title: "Error loading project file",
            message: `The security token referenced by the project cannot be found in your current application settings.
                Verify the security token exists and try to reload the project.`,
        },
        canvasError: {
            title: "Error loading canvas",
            message: "There was an error loading the canvas, check the project's assets and try again.",
        },
        importError: {
            title: "Error importing V1 project",
            message: "There was an error importing the V1 project. Check the project file and try again",
        },
        pasteRegionTooBigError: {
            title: "Error pasting region",
            message: "Region too big for this asset. Try copying another region",
        },
        exportFormatNotFound: {
            title: "Error exporting project",
            message: "Project is missing export format.  Please select an export format in the export setting page.",
        },
    },
};
