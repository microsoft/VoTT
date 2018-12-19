import LocalizedStrings, { LocalizedStringsMethods } from 'react-localization'

export interface IStrings extends LocalizedStringsMethods{
    appName: string;
    common: {
        displayName: string;
        description: string;
        submit: string;
        cancel: string;
    },
    homePage: {
        newProject: string;
        openProject: string;
        recentProjects: string;
    },
    menuBar: {
        file: {
            exit: string;
        }
        edit: {
            undo: string;
            redo: string;
            cut: string;
            copy: string;
            paste: string;
            pasteAndMatchStyle: string;
            delete: string;
            selectAll: string;
        }
        view: {
            reload: string;
            forceReload: string;
            toggleDevTools: string;
            actualSize: string;
            toggleFullScreen: string;
        }
        window: {
            minimize: string;
            close: string;
        }
        help: {
            learnMore: string;
            documentation: string;
            communityDiscussions: string;
            searchIssues: string;
        }
    },
    projectSettings: {
        sourceConnection: string;
        targetConnection: string;
        addConnection: string;
        tags: string;
    },
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
            }
        }
    },
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
    }
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
            recentProjects: "Recent Projects"
        },
        menuBar: {
            file: {
                exit: "Exit"
            },
            edit: {
                undo: "Undo",
                redo: "Redo",
                cut: "Cut",
                copy: "Copy",
                paste: "Paste",
                pasteAndMatchStyle: "Paste and Match Style",
                delete: "Delete",
                selectAll: "Select All"
            },
            view: {
                reload: "Reload",
                forceReload: "Force Reload",
                toggleDevTools: "Toggle Dev Tools",
                actualSize: "Actual Size",
                toggleFullScreen: "Toggle Full Screen"
            },
            window: {
                minimize: "Minimize",
                close: "Close"
            },
            help: {
                learnMore: "Learn More",
                documentation: "Documentation",
                communityDiscussions: "Community Discussions",
                searchIssues: "Search Issues"
            }
        },
        projectSettings: {
            sourceConnection: "Source Connection",
            targetConnection: "Target Connection",
            addConnection: "Add Connection",
            tags: "Tags"
        },
        connections: {
            title: "Connections",
            settings: "Connection Settings",
            details: "Connection Details",
            connectionPageInstructions: "Please select a connection to edit",
            provider: "Provider",
            providers: {
                azureBlob: {
                    title: "Azure Blob Storage"
                },
                bing: {
                    title: "Bing Image Search",
                    options: "Bing Image Search Options",
                    apiKey: "API Key",
                    query: "Query",
                    aspectRatio: "Aspect Ratio"
                },
                local: {
                    title: "Local File System",
                    folderPath: "Folder Path",
                    selectFolder: "Select Folder"
                }
            }
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
                exportProject: "Export Project"
            }
        }
    }
})