import { IAppStrings } from "../strings";

export const english: IAppStrings = {
    appName: "Visual Object Tagging Tool",
    common: {
        displayName: "Display Name",
        description: "Description",
        submit: "Submit",
        cancel: "Cancel",
        provider: "Provider",
    },
    homePage: {
        newProject: "New Project",
        openProject: "Open Project",
        recentProjects: "Recent Projects",
    },
    appSettings: {
        storageTitle: "Storage Settings",
        uiHelp: "Where your settings are stored",
    },
    projectSettings: {
        sourceConnection: {
            title: "Source Connection",
            description: "Where to load assets from",
        },
        targetConnection: {
            title: "Target Connection",
            description: "Where to save the project and exported data",
        },
        addConnection: "Add Connection",
    },
    tags: {
        title: "Tags",
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
        connectionPageInstructions: "Please select a connection to edit",
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
    exportPage: {
        providers: {
            vottJson: "VoTT JSON",
            azureCV: "Azure Custom Vision Service",
            tfRecords: "Tensorflow Records",
        },
    },
};
