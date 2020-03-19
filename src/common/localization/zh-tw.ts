import { IAppStrings } from "../strings";

/**
 * App Strings for Traditional Chinese (zh-tw)
 */
export const chinesetw: IAppStrings = {
    appName: "視覺物件標記工具", // Visual Object Tagging Tool
    common: {
        displayName: "表示名稱", // Display Name
        description: "說明", // Description
        submit: "送出", // Submit
        cancel: "取消", // Cancel
        save: "保存", // Save
        delete: "刪除", // Delete
        provider: "提供者", // Provider
        homePage: "首頁" // Home Page
    },
    titleBar: {
        help: "求助", // Help
        minimize: "最小化", // Minimize
        maximize: "最大化", // Maximize
        restore: "回復", // Restore
        close: "關閉" // Close
    },
    homePage: {
        newProject: "新專案", // New Project
        openLocalProject: {
            title: "打開本地專案" // Open Local Project
        },
        openCloudProject: {
            title: "打開雲端專案", // Open Cloud Project
            selectConnection: "選擇連接" // Select a Connection
        },
        recentProjects: "最近的專案", // Recent Projects
        deleteProject: {
            title: "刪除專案", // Delete Project
            confirmation: "確定要刪除專案嗎" // Are you sure you want to delete project
        },
        importProject: {
            title: "匯入專案", // Import Project
            confirmation: "您確定要將專案$ {project.file.name}轉換為v2格式嗎？我們建議您首先備份專案文件。" // Are you sure you want to convert project ${project.file.name} project settings to v2 format? We recommend you backup the project file first.
        },
        messages: {
            deleteSuccess: "已成功刪除$ {project.name}" // Successfully deleted ${project.name}
        }
    },
    appSettings: {
        title: "應用程式設定", // Application Settings
        storageTitle: "儲存設定", // Storage Settings
        uiHelp: "您的設定存儲在哪裡", // Where your settings are stored
        save: "保存設定", // Save Settings
        securityToken: {
            name: {
                title: "名稱" // Name
            },
            key: {
                title: "鍵" // Key
            }
        },
        securityTokens: {
            title: "安全令牌", // Security Tokens // Rex Todo
            description: "安全令牌用於加密項目配置中的敏感數據" // Security tokens are used to encrypt sensitive data within your project configuration
        },
        version: {
            description: "版本：" // Version:
        },
        commit: "提交SHA", // Commit SHA
        devTools: {
            description: "打開應用程序開發人員工具以幫助診斷問題", // Open application developer tools to help diagnose issues
            button: "切換開發人員工具" // Toggle Developer Tools
        },
        reload: {
            description: "重新開始，放棄所有當前更改", // Reload the app discarding all current changes
            button: "刷新程式" // Refresh Application
        },
        messages: {
            saveSuccess: "成功保存應用程式設定" // Successfully saved application settings
        }
    },
    projectSettings: {
        title: "專案設定", // Project Settings
        securityToken: {
            title: "安全令牌", // Security Token
            description: "用於加密專案文件中的敏感數據" // Used to encrypt sensitive data within project files
        },
        save: "保存專案", // Save Project
        sourceConnection: {
            title: "來源接續", // Source Connection
            description: "從何處加載資料" // Where to load assets from
        },
        targetConnection: {
            title: "目標接續", // Target Connection
            description: "在哪裡保存專案和匯出的數據" // Where to save the project and exported data
        },
        videoSettings: {
            title: "影片設定", // Video Settings
            description: "影像以進行標記的速率", // The rate at which frames are extracted for tagging.
            frameExtractionRate: "影像提取率（每視頻每秒的畫面數）" // Frame Extraction Rate (frames per a video second)
        },
        addConnection: "新增連線", // Add Connection
        messages: {
            saveSuccess: "成功保存$ {project.name}專案設置" // Successfully saved ${project.name} project settings
        }
    },
    projectMetrics: {
        title: "項目指標", // Project Metrics
        assetsSectionTitle: "資產", // Assets
        totalAssetCount: "總資產", // Total Assets
        visitedAssets: "訪問的資產（$ {count}）", // Visited Assets (${count})
        taggedAssets: "標記資產（$ {count}）", // Tagged Assets (${count})
        nonTaggedAssets: "未標記的資產（$ {count}）", // Not Tagged Assets (${count})
        nonVisitedAssets: "未訪問的資產（$ {count}）", // Not Visited Assets (${count})
        tagsSectionTitle: "標籤和標籤", // Tags & Labels
        totalRegionCount: "標記區域總數", // Total Tagged Regions
        totalTagCount: "總標籤", // Total Tags
        avgTagCountPerAsset: "每個資產的平均標籤" // Average tags per asset
    },
    tags: {
        title: "標籤", // Tags
        placeholder: "新增標籤", // Add new tag
        editor: "標籤編輯器", // Tags Editor
        modal: {
            name: "標籤名稱", // Tag Name
            color: "標籤顏色" // Tag Color
        },
        colors: {
            white: "白色", // White
            gray: "灰色", // Gray
            red: "紅色", // Red
            maroon: "栗色", // Maroon
            yellow: "黃色", // Yellow
            olive: "橄欖", // Olive
            lime: "酸橙", // Lime
            green: "綠色", // Green
            aqua: "水色", // Aqua
            teal: "藍綠色", // Teal
            blue: "藍色", // Blue
            navy: "海軍", // Navy
            fuschia: "紫紅色", // Fuschia
            purple: "紫色" // Purple
        },
        warnings: {
            existingName: "標籤名稱已存在。選擇另一個名字", // Tag name already exists. Choose another name
            emptyName: "標籤名稱不能為空", // Cannot have an empty tag name
            unknownTagName: "未知" // Unknown
        },
        toolbar: {
            add: "新增標籤", // Add new tag
            search: "搜索標籤", // Search tags
            edit: "編輯標籤", // Edit tag
            lock: "鎖標籤", // Lock tag
            moveUp: "向上移動標籤", // Move tag up
            moveDown: "向下移動標籤", // Move tag down
            delete: "刪除標籤" // Delete tag
        }
    },
    connections: {
        title: "連接數", // Connections
        details: "連接細節", // Connection Details
        settings: "連接設定", // Connection Settings
        instructions: "請選擇一個連接進行編輯", // Please select a connection to edit
        save: "保存連接", // Save Connection
        messages: {
            saveSuccess: "成功保存$ {connection.name}", // Successfully saved ${connection.name}
            deleteSuccess: "已成功刪除$ {connection.name}" // Successfully deleted ${connection.name}
        },
        imageCorsWarning: "警告：在Web瀏覽器中使用VoTT時，由於CORS（跨源資源共享）限制，來自Bing Image Search的某些資產可能無法正確導出。", // Warning: When using VoTT in a Web browser, some assets from Bing Image Search may not export correctly due to CORS (Cross Origin Resource Sharing) restrictions.
        blobCorsWarning: "警告：必須在Azure Blob存儲帳戶上啟用CORS（跨域資源共享），才能將其用作源或目標連接。 {0}中提供了有關啟用CORS的更多信息。", // Warning: CORS (Cross Domain Resource Sharing) must be enabled on the Azure Blob Storage account, in order to use it as a source or target connection. More information on enabling CORS can be found in the {0}
        azDocLinkText: "Azure文檔", // Azure Documentation.
        providers: {
            azureBlob: {
                title: "Azure Blob存儲", // Azure Blob Storage
                description: "",
                accountName: {
                    title: "用戶名", // Account Name
                    description: "",
                },
                containerName: {
                    title: "容器名稱", // Container Name
                    description: "",
                },
                sas: {
                    title: "SAS", // SAS
                    description: "用於驗證Blob存儲帳戶的共享訪問簽名" // Shared access signature used to authenticate to the blob storage account
                },
                createContainer: {
                    title: "創建容器", // Create Container
                    description: "創建blob容器（如果尚不存在）" // Creates the blob container if it does not already exist
                }
            },
            bing: {
                title: "必應圖片搜索", // Bing Image Search
                options: "必應圖像搜索選項", // Bing Image Search Options
                apiKey: "API密鑰", // API Key
                query: "詢問", // Query
                aspectRatio: {
                    title: "長寬比", // Aspect Ratio
                    all: "所有", // All
                    square: "廣場", // Square
                    wide: "寬", // Wide
                    tall: "高" // Tall
                }
            },
            local: {
                title: "本地文件系統", // Local File System
                folderPath: "資料夾路徑", // Folder Path
                selectFolder: "選擇文件夾", // Select Folder
                chooseFolder: "選擇資料夾" // Choose Folder
            }
        }
    },
    editorPage: {
        width: "寬度", // Width
        height: "高度", // Height
        tagged: "已標記", // Tagged
        visited: "來過", // Visited
        toolbar: {
            select: "選擇[V]", // Select (V)
            pan: "泛", // Pan
            drawRectangle: "畫矩形", // Draw Rectangle
            drawPolygon: "繪製多邊形", // Draw Polygon
            copyRectangle: "複製矩形", // Copy Rectangle
            copy: "複製區域", // Copy Regions
            cut: "切割區域", // Cut Regions
            paste: "粘貼區域", // Paste Regions
            removeAllRegions: "刪除所有地區", // Remove All Regions
            previousAsset: "以前的資產", // Previous Asset
            nextAsset: "下一項資產", // Next Asset
            saveProject: "保存項目", // Save Project
            exportProject: "出口項目", // Export Project
            activeLearning: "主動學習" // Active Learning
        },
        videoPlayer: {
            previousTaggedFrame: {
                tooltip: "上一個標記的框架" // Previous Tagged Frame
            },
            nextTaggedFrame: {
                tooltip: "下一個標記的框架" // Next Tagged Frame
            },
            previousExpectedFrame: {
                tooltip: "上一幀" // Previous Frame
            },
            nextExpectedFrame: {
                tooltip: "下一幀" // Next Frame
            }
        },
        help: {
            title: "切換幫助菜單", // Toggle Help Menu
            escape: "逃生幫助菜單" // Escape Help Menu
        },
        assetError: "無法加載資產", // Unable to load asset
        tags: {
            hotKey: {
                apply: "使用熱鍵應用標籤", // Apply Tag with Hot Key
                lock: "用熱鍵鎖定標籤" // Lock Tag with Hot Key
            },
            rename: {
                title: "重命名標籤", // Rename Tag
                confirmation: "您確定要重命名此標籤嗎？它將在所有資產中重命名" // Are you sure you want to rename this tag? It will be renamed throughout all assets
            },
            delete: {
                title: "刪除標籤", // Delete Tag
                confirmation: "您確定要刪除此標籤嗎？它將在所有資產中刪除，並且唯一標記的任何區域也將被刪除" // Are you sure you want to delete this tag? It will be deleted throughout all assets and any regions where this is the only tag will also be deleted
            }
        },
        canvas: {
            removeAllRegions: {
                title: "刪除所有地區", // Remove All Regions
                confirmation: "您確定要刪除所有區域嗎？" // Are you sure you want to remove all regions?
            }
        },
        messages: {
            enforceTaggedRegions: {
                title: "檢測到無效的區域", // Invalid region(s) detected
                description: "1個或多個區域尚未被標記。在繼續下一個資產之前，請確保所有區域均已標記。" // 1 or more regions have not been tagged.  Ensure all regions are tagged before continuing to next asset.
            }
        }
    },
    export: {
        title: "出口", // Export
        settings: "匯出設定", // Export Settings
        saveSettings: "保存導出設置", // Save Export Settings
        providers: {
            common: {
                properties: {
                    assetState: {
                        title: "資產狀態", // Asset State
                        description: "出口中包括哪些資產", // Which assets to include in the export
                        options: {
                            all: "所有資產", // All Assets
                            visited: "僅已訪問資產", // Only Visited Assets
                            tagged: "僅標記資產" // Only tagged Assets
                        }
                    },
                    testTrainSplit: {
                        title: "測試/火車分割", // Test / Train Split
                        description: "測試列拆分以用於導出數據" // The test train split to use for exported data
                    },
                    includeImages: {
                        title: "包含圖片", // Include Images
                        description: "是否在目標連接中包括二進制映像資產" // Whether or not to include binary image assets in target connection
                    }
                }
            },
            vottJson: {
                displayName: "VoTT JSON" // VoTT JSON
            },
            azureCV: {
                displayName: "Azure自定義視覺服務", // Azure Custom Vision Service
                regions: {
                    australiaEast: "東澳大利亞", // Australia East
                    centralIndia: "印度中部", // Central India
                    eastUs: "美國東部", // East US
                    eastUs2: "美國東部2", // East US 2
                    japanEast: "東日本", // Japan East
                    northCentralUs: "美國中北部", // North Central US
                    northEurope: "北歐", // North Europe
                    southCentralUs: "美國中南部", // South Central US
                    southeastAsia: "東南亞", // Southeast Asia
                    ukSouth: "英國南部", // UK South
                    westUs2: "美國西部2", // West US 2
                    westEurope: "西歐" // West Europe
                },
                properties: {
                    apiKey: {
                        title: "API密鑰" // API Key
                    },
                    region: {
                        title: "區域", // Region
                        description: "部署服務的Azure區域" // The Azure region where your service is deployed
                    },
                    classificationType: {
                        title: "分類類型", // Classification Type
                        options: {
                            multiLabel: "每個圖像多個標籤", // Multiple tags per image
                            multiClass: "每個圖像一個標籤" // Single tag per image
                        }
                    },
                    name: {
                        title: "項目名" // Project Name
                    },
                    description: {
                        title: "項目簡介" // Project Description
                    },
                    domainId: {
                        title: "域" // Domain
                    },
                    newOrExisting: {
                        title: "新項目或現有項目", // New or Existing Project
                        options: {
                            new: "新項目", // New Project
                            existing: "現有項目" // Existing Project
                        }
                    },
                    projectId: {
                        title: "項目名" // Project Name
                    },
                    projectType: {
                        title: "項目類型", // Project Type
                        options: {
                            classification: "分類", // Classification
                            objectDetection: "物體檢測" // Object Detection
                        }
                    }
                }
            },
            tfRecords: {
                displayName: "Tensorflow記錄" // Tensorflow Records
            },
            pascalVoc: {
                displayName: "Pascal VOC", // Pascal VOC
                exportUnassigned: {
                    title: "導出未分配", // Export Unassigned
                    description: "是否在導出的數據中包括未分配的標籤" // Whether or not to include unassigned tags in exported data
                }
            },
            cntk: {
                displayName: "Microsoft Cognitive Toolkit（CNTK)" // Microsoft Cognitive Toolkit (CNTK)
            },
            csv: {
                displayName: "逗號分隔值 (CSV)" // Comma Separated Values (CSV)
            }
        },
        messages: {
            saveSuccess: "成功保存導出設置" // Successfully saved export settings
        }
    },
    activeLearning: {
        title: "主動學習", // Active Learning
        form: {
            properties: {
                modelPathType: {
                    title: "模型提供者", // Model Provider
                    description: "從何處加載訓練模型", // Where to load the training model from
                    options: {
                        preTrained: "預先訓練Coco SSD", // Pre-trained Coco SSD
                        customFilePath: "自定義（文件路徑）", // Custom (File path)
                        customWebUrl: "自訂 (URL)" // Custom (Url)
                    }
                },
                autoDetect: {
                    title: "自動偵測", // Auto Detect
                    description: "在資產之間導航時是否自動進行預測" // Whether or not to automatically make predictions as you navigate between assets
                },
                modelPath: {
                    title: "模型路徑", // Model path
                    description: "從本地文件系統中選擇模型" // Select a model from your local file system
                },
                modelUrl: {
                    title: "型號網址", // Model URL
                    description: "從公共網址加載模型" // Load your model from a public web URL
                },
                predictTag: {
                    title: "預測標籤", // Predict Tag
                    description: "是否在預測中自動包含標籤" // Whether or not to automatically include tags in predictions
                }
            }
        },
        messages: {
            loadingModel: "正在加載主動學習模型...", // Loading active learning model...
            errorLoadModel: "加載主動學習模型時出錯", // Error loading active learning model
            saveSuccess: "成功保存了主動學習設置" // Successfully saved active learning settings
        }
    },
    profile: {
        settings: "個人資料設置" // Profile Settings
    },
    errors: {
        unknown: {
            title: "未知錯誤", // Unknown Error
            message: "該應用程序遇到未知錯誤。請再試一遍。" // The app encountered an unknown error. Please try again.
        },
        projectUploadError: {
            title: "上傳文件時出錯", // Error Uploading File
            message: "上傳文件時出錯。請確認文件格式正確，然後重試。" // There was an error uploading the file. Please verify the file is of the correct format and try again.
        },
        genericRenderError: {
            title: "加載應用程序時出錯", // Error Loading Application
            message: "呈現應用程序時發生錯誤。請再試一遍" // An error occured while rendering the application. Please try again
        },
        projectInvalidSecurityToken: {
            title: "加載項目文件時出錯", // Error loading project file
            message: "項目引用的安全令牌無效。驗證是否在您的應用程序設置中正確設置了項目的安全令牌" // The security token referenced by the project is invalid. Verify that the security token for the project has been set correctly within your application settings
        },
        projectInvalidJson: {
            title: "解析項目文件時出錯", // Error parsing project file
            message: "所選的項目文件不包含有效的JSON。請重試該文件。" // The selected project files does not contain valid JSON. Please check the file any try again.
        },
        projectDeleteError: {
            title: "刪除項目時出錯", // Error deleting project
            message: "刪除項目時發生錯誤。驗證項目文件和安全令牌是否存在，然後重試" // An error occured while deleting the project. Validate the project file and security token exist and try again
        },
        securityTokenNotFound: {
            title: "加載項目文件時出錯", // Error loading project file
            message: "在當前的應用程序設置中找不到該項目引用的安全令牌。驗證安全令牌是否存在，然後嘗試重新加載項目。" // The security token referenced by the project cannot be found in your current application settings. Verify the security token exists and try to reload the project.
        },
        canvasError: {
            title: "加載畫佈時出錯", // Error loading canvas
            message: "加載畫佈時發生錯誤，請檢查項目的資產，然後重試。" // There was an error loading the canvas, check the project's assets and try again.
        },
        importError: {
            title: "導入V1項目時出錯", // Error importing V1 project
            message: "導入V1項目時出錯。檢查項目文件，然後重試" // There was an error importing the V1 project. Check the project file and try again
        },
        pasteRegionTooBigError: {
            title: "錯誤粘貼區域", // Error pasting region
            message: "該資產太大的區域。嘗試複製其他地區" // Region too big for this asset. Try copying another region
        },
        exportFormatNotFound: {
            title: "導出項目時出錯", // Error exporting project
            message: "項目缺少導出格式。請在導出設置頁面中選擇一種導出格式。" // Project is missing export format.  Please select an export format in the export setting page.
        },
        activeLearningPredictionError: {
            title: "主動學習錯誤", // Active Learning Error
            message: "預測當前資產中的區域時發生錯誤。請驗證您的有效學習配置，然後重試" // An error occurred while predicting regions in the current asset. Please verify your active learning configuration and try again
        },
    },
};
