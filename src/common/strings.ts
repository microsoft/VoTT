import LocalizedStrings, { LocalizedStringsMethods } from "react-localization";
import { english } from "./localization/en-us";
import { spanish } from "./localization/es-cl";

/**
 * Interface for all required strings in application
 * Language must add all strings to be compliant for localization
 */
export interface IAppStrings {
    appName: string;
    common: {
        displayName: string;
        description: string;
        submit: string;
        cancel: string;
        save: string;
        delete: string;
        provider: string;
        homePage: string;
    };
    titleBar: {
        help: string;
        minimize: string;
        maximize: string;
        restore: string;
        close: string;
    };
    homePage: {
        newProject: string;
        openLocalProject: {
            title: string;
        },
        openCloudProject: {
            title: string;
            selectConnection: string;
        },
        deleteProject: {
            title: string;
            confirmation: string;
        },
        importProject: {
            title: string;
            confirmation: string;
        },
        recentProjects: string,
        messages: {
            deleteSuccess: string,
        },
    };
    appSettings: {
        title: string;
        storageTitle: string;
        uiHelp: string;
        save: string;
        securityToken: {
            name: {
                title: string;
            },
            key: {
                title: string;
            },
        },
        securityTokens: {
            title: string;
            description: string;
        },
        version: {
            description: string;
        },
        commit: string,
        devTools: {
            description: string;
            button: string;
        },
        reload: {
            description: string;
            button: string;
        },
        messages: {
            saveSuccess: string;
        },
    };
    projectSettings: {
        title: string;
        securityToken: {
            title: string;
            description: string;
        },
        save: string;
        sourceConnection: {
            title: string;
            description: string;
        },
        targetConnection: {
            title: string;
            description: string;
        },
        videoSettings: {
            title: string;
            description: string;
            frameExtractionRate: string;
        },
        addConnection: string,
        messages: {
            saveSuccess: string;
        },
    };
    projectMetrics: {
        title: string;
        assetsSectionTitle: string
        totalAssetCount: string;
        visitedAssets: string;
        taggedAssets: string;
        nonVisitedAssets: string;
        nonTaggedAssets: string;
        tagsSectionTitle: string;
        totalRegionCount: string;
        totalTagCount: string;
        avgTagCountPerAsset: string;
    };
    tags: {
        title: string;
        placeholder: string;
        editor: string;
        modal: {
            name: string;
            color: string;
        }
        toolbar: {
            add: string;
            search: string;
            lock: string;
            edit: string;
            moveUp: string;
            moveDown: string;
            delete: string;
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
        warnings: {
            existingName: string;
            emptyName: string;
        }
    };
    connections: {
        title: string;
        details: string;
        settings: string;
        instructions: string;
        save: string;
        messages: {
            saveSuccess: string;
            deleteSuccess: string;
        },
        imageCorsWarning: string;
        blobCorsWarning: string;
        azDocLinkText: string;
        providers: {
            azureBlob: {
                title: string;
                description: string,
                accountName: {
                    title: string,
                    description: string,
                },
                containerName: {
                    title: string,
                    description: string,
                },
                sas: {
                    title: string,
                    description: string,
                },
                createContainer: {
                    title: string,
                    description: string,
                }
            },
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
        tagged: string;
        visited: string;
        toolbar: {
            select: string;
            pan: string;
            drawRectangle: string;
            drawPolygon: string;
            copyRectangle: string;
            copy: string;
            cut: string;
            paste: string;
            removeAllRegions: string;
            previousAsset: string;
            nextAsset: string;
            saveProject: string;
            exportProject: string;
        }
        videoPlayer: {
            nextTaggedFrame: {
                tooltip: string,
            },
            previousTaggedFrame: {
                tooltip: string,
            },
            nextExpectedFrame: {
                tooltip: string,
            },
            previousExpectedFrame: {
                tooltip: string,
            },
        }
        help: {
            title: string;
            escape: string;
        }
        assetError: string;
        tags: {
            hotKey: {
                apply: string;
                lock: string;
            },
        }
        canvas: {
            removeAllRegions: {
                title: string;
                confirmation: string;
            },
        },
        messages: {
            enforceTaggedRegions: {
                title: string,
                description: string,
            },
        }
    };
    export: {
        title: string;
        settings: string;
        saveSettings: string;
        providers: {
            common: {
                properties: {
                    assetState: {
                        title: string,
                        description: string,
                        options: {
                            all: string,
                            visited: string,
                            tagged: string,
                        },
                    },
                },
            },
            vottJson: {
                displayName: string,
                properties: {
                    includeImages: {
                        title: string,
                        description: string,
                    },
                },
            },
            azureCV: {
                displayName: string,
                properties: {
                    apiKey: {
                        title: string,
                    },
                    newOrExisting: {
                        title: string,
                        options: {
                            new: string,
                            existing: string,
                        },
                    },
                    name: {
                        title: string,
                    },
                    description: {
                        title: string,
                    },
                    projectType: {
                        title: string,
                        options: {
                            classification: string,
                            objectDetection: string,
                        },
                    },
                    classificationType: {
                        title: string,
                        options: {
                            multiLabel: string,
                            multiClass: string,
                        },
                    },
                    domainId: {
                        title: string,
                    },
                    projectId: {
                        title: string,
                    },
                },
            },
            tfRecords: {
                displayName: string,
            },
            pascalVoc: {
                displayName: string,
                testTrainSplit: {
                    title: string,
                    description: string,
                },
                exportUnassigned: {
                    title: string,
                    description: string,
                },
            },
        },
        messages: {
            saveSuccess: string;
        },
    };
    activeLearning: {
        title: string;
    };
    profile: {
        settings: string;
    };
    errors: {
        unknown: IErrorMetadata,
        projectInvalidJson: IErrorMetadata,
        projectInvalidSecurityToken: IErrorMetadata,
        projectUploadError: IErrorMetadata,
        projectDeleteError: IErrorMetadata,
        genericRenderError: IErrorMetadata,
        securityTokenNotFound: IErrorMetadata,
        canvasError: IErrorMetadata,
        importError: IErrorMetadata,
        pasteRegionTooBigError: IErrorMetadata,
        exportFormatNotFound: IErrorMetadata,
    };
}

interface IErrorMetadata {
    title: string;
    message: string;
}

interface IStrings extends LocalizedStringsMethods, IAppStrings { }

export const strings: IStrings = new LocalizedStrings({
    en: english,
    es: spanish,
});

/**
 * Add localization values to JSON object. Substitutes value
 * of variable placeholders with value of currently set language
 * Example variable: ${strings.profile.settings}
 * @param json JSON object containing variable placeholders
 */
export function addLocValues(json: any) {
    return interpolateJson(json, { strings });
}

/**
 * Stringifies the JSON and substitutes values from params
 * @param json JSON object
 * @param params Parameters for substitution
 */
export function interpolateJson(json: any, params: any) {
    const template = JSON.stringify(json);
    const outputJson = interpolate(template, params);
    return JSON.parse(outputJson);
}

/**
 * Makes substitution of values in string
 * @param template String containing variables
 * @param params Params containing substitution values
 */
export function interpolate(template: string, params: any) {
    const names = Object.keys(params);
    const vals = Object["values"](params);
    return new Function(...names, `return \`${template}\`;`)(...vals);
}
