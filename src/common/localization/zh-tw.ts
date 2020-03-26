import { IAppStrings } from "../strings";

/**
<<<<<<< HEAD
 * App Strings for Simplified Chinese (zh-tw)
 */
export const chinesetw: IAppStrings = {
    appName: "視覺對象標記工具", // Visual Object Tagging Tool
    common: {
        displayName: "顯示名稱", // Display Name
        description: "描述", // Description
        submit: "提交", // Submit
=======
 * App Strings for Traditional Chinese (zh-tw)
 */
export const chinesetw: IAppStrings = {
    appName: "VOTT視覺物件標記工具", // Visual Object Tagging Tool
    common: {
        displayName: "表示名稱", // Display Name
        description: "說明", // Description
        submit: "送出", // Submit
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
        cancel: "取消", // Cancel
        save: "保存", // Save
        delete: "刪除", // Delete
        provider: "提供者", // Provider
<<<<<<< HEAD
        homePage: "主頁" // Home Page
    },
    titleBar: {
        help: "救命", // Help
        minimize: "最小化", // Minimize
        maximize: "最大化", // Maximize
        restore: "恢復", // Restore
        close: "關" // Close
    },
    homePage: {
        newProject: "新項目", // New Project
        openLocalProject: {
            title: "打開本地項目" // Open Local Project
        },
        openCloudProject: {
            title: "開放雲項目", // Open Cloud Project
            selectConnection: "選擇一個連接" // Select a Connection
        },
        recentProjects: "最近的項目", // Recent Projects
        deleteProject: {
            title: "刪除專案", // Delete Project
            confirmation: "確定要刪除項目嗎" // Are you sure you want to delete project
        },
        importProject: {
            title: "導入項目", // Import Project
            confirmation: "您確定要將項目$ {project.file.name}項目設置轉換為v2格式嗎？我們建議您首先備份項目文件。" // Are you sure you want to convert project ${project.file.name} project settings to v2 format? We recommend you backup the project file first.
        },
        messages: {
            deleteSuccess: "已成功刪除$ {project.name}" // Successfully deleted ${project.name}
        }
    },
    appSettings: {
        title: "應用程序設置", // Application Settings
        storageTitle: "儲存設定", // Storage Settings
        uiHelp: "您的設置存儲在哪裡", // Where your settings are stored
        save: "保存設置", // Save Settings
=======
        homePage: "首頁" // Home Page
    },
    titleBar: {
        help: "說明", // Help
        minimize: "最小化", // Minimize
        maximize: "最大化", // Maximize
        restore: "還原", // Restore
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
            deleteSuccess: "已成功刪除$ {project.name}專案" // Successfully deleted ${project.name}
        }
    },
    appSettings: {
        title: "應用程式設定", // Application Settings
        storageTitle: "儲存空間設定", // Storage Settings
        uiHelp: "您的設定存儲在哪裡", // Where your settings are stored
        save: "保存設定", // Save Settings
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
        securityToken: {
            name: {
                title: "名稱" // Name
            },
            key: {
                title: "鍵" // Key
            }
        },
        securityTokens: {
<<<<<<< HEAD
            title: "安全令牌", // Security Tokens
            description: "安全令牌用於加密項目配置中的敏感數據" // Security tokens are used to encrypt sensitive data within your project configuration
        },
        version: {
            description: "版：" // Version:
        },
        commit: "提交SHA", // Commit SHA
        devTools: {
            description: "打開應用程序開發人員工具以幫助診斷問題", // Open application developer tools to help diagnose issues
            button: "切換開發人員工具" // Toggle Developer Tools
        },
        reload: {
            description: "重新加載應用，放棄所有當前更改", // Reload the app discarding all current changes
            button: "刷新申請" // Refresh Application
        },
        messages: {
            saveSuccess: "成功保存應用程序設置" // Successfully saved application settings
        }
    },
    projectSettings: {
        title: "項目設定", // Project Settings
        securityToken: {
            title: "安全令牌", // Security Token
            description: "用於加密項目文件中的敏感數據" // Used to encrypt sensitive data within project files
        },
        save: "保存項目", // Save Project
        sourceConnection: {
            title: "源連接", // Source Connection
            description: "從何處加載資產" // Where to load assets from
        },
        targetConnection: {
            title: "目標連接", // Target Connection
            description: "在哪裡保存項目和導出的數據" // Where to save the project and exported data
        },
        videoSettings: {
            title: "影片設定", // Video Settings
            description: "提取幀以進行標記的速率", // The rate at which frames are extracted for tagging.
            frameExtractionRate: "幀提取率（每視頻每秒的幀數）" // Frame Extraction Rate (frames per a video second)
        },
        addConnection: "添加連接", // Add Connection
        messages: {
            saveSuccess: "成功保存$ {project.name}項目設置" // Successfully saved ${project.name} project settings
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
=======
            title: "安全性權證", // Security Tokens
            description: "安全性權證用於加密專案配置中的敏感數據" // Security tokens are used to encrypt sensitive data within your project configuration
        },
        version: {
            description: "版本：" // Version:
        },
        commit: "提交SHA", // Commit SHA
        devTools: {
            description: "打開應用程式開發工具以幫助診斷問題", // Open application developer tools to help diagnose issues
            button: "切換開發工具" // Toggle Developer Tools
        },
        reload: {
            description: "重新載入應用程式，放棄所有目前設定", // Reload the app discarding all current changes
            button: "重新整理應用程式" // Refresh Application
        },
        messages: {
            saveSuccess: "已成功保存應用程式設定" // Successfully saved application settings
        }
    },
    projectSettings: {
        title: "專案設定", // Project Settings
        securityToken: {
            title: "安全性權證", // Security Token
            description: "用於加密專案檔案中的敏感數據" // Used to encrypt sensitive data within project files
        },
        save: "保存專案", // Save Project
        sourceConnection: {
            title: "來源連接", // Source Connection
            description: "從何處讀取資料" // Where to load assets from
        },
        targetConnection: {
            title: "目標連接", // Target Connection
            description: "在哪裡保存專案和匯出的數據" // Where to save the project and exported data
        },
        videoSettings: {
            title: "影片設定", // Video Settings
            description: "設定影片標記的速率", // The rate at which frames are extracted for tagging.
            frameExtractionRate: "影像取樣率（影像每秒的畫面數）" // Frame Extraction Rate (frames per a video second)
        },
        addConnection: "新增連線", // Add Connection
        messages: {
            saveSuccess: "已成功保存$ {project.name}專案設定" // Successfully saved ${project.name} project settings
        }
    },
    projectMetrics: {
        title: "專案相關指標", // Project Metrics
        assetsSectionTitle: "圖像數據", // Assets // As for this VOTT tool, translate "Assets" to "Image data" in Traditional Chinese, as "Asset" can be confusing if directly translated.
        totalAssetCount: "圖像數據總數", // Total Assets
        visitedAssets: "已檢視的圖像數據（$ {count}）", // Visited Assets (${count})
        taggedAssets: "已標記的圖像數據（$ {count}）", // Tagged Assets (${count})
        nonTaggedAssets: "未標記的圖像數據（$ {count}）", // Not Tagged Assets (${count})
        nonVisitedAssets: "未檢視的圖像數據（$ {count}）", // Not Visited Assets (${count})
        tagsSectionTitle: "標記和標籤", // Tags & Labels, so it can actually be same translation to Tags and Labels in Traditional Chinese, to differentiate, having slightly different translation for both keywords.
        totalRegionCount: "已標記區域總數", // Total Tagged Regions
        totalTagCount: "標記總數", // Total Tags
        avgTagCountPerAsset: "每個圖像數據的平均標記數" // Average tags per asset
    },
    tags: {
        title: "標記", // Tags
        placeholder: "新增標記", // Add new tag
        editor: "標記編輯器", // Tags Editor
        modal: {
            name: "標記名稱", // Tag Name
            color: "標記顏色" // Tag Color
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
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
<<<<<<< HEAD
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
=======
            existingName: "標記名稱已存在。選擇另一個名字", // Tag name already exists. Choose another name
            emptyName: "標記名稱不能為空白", // Cannot have an empty tag name
            unknownTagName: "未命名" // Unknown
        },
        toolbar: {
            add: "新增標記", // Add new tag
            search: "尋找標記", // Search tags
            edit: "編輯標記", // Edit tag
            lock: "鎖定標記", // Lock tag
            moveUp: "向上移動標記", // Move tag up
            moveDown: "向下移動標記", // Move tag down
            delete: "刪除標記" // Delete tag
        }
    },
    connections: {
        title: "連接", // Connections
        details: "連接詳細", // Connection Details
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
        settings: "連接設定", // Connection Settings
        instructions: "請選擇一個連接進行編輯", // Please select a connection to edit
        save: "保存連接", // Save Connection
        messages: {
<<<<<<< HEAD
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
=======
            saveSuccess: "已成功保存$ {connection.name}", // Successfully saved ${connection.name}
            deleteSuccess: "已成功刪除$ {connection.name}" // Successfully deleted ${connection.name}
        },
        imageCorsWarning: "警告：在Web瀏覽器中使用VoTT時，由於CORS（跨源資源共享）限制，來自Bing Image Search的某些圖像數據可能無法正確匯出。", // Warning: When using VoTT in a Web browser, some assets from Bing Image Search may not export correctly due to CORS (Cross Origin Resource Sharing) restrictions.
        blobCorsWarning: "警告：必須在Azure Blob存儲帳戶上啟用CORS（跨域資源共享），才能將其用作來源或目標連接。 {0}中提供了有關啟用CORS的更多資訊。", // Warning: CORS (Cross Domain Resource Sharing) must be enabled on the Azure Blob Storage account, in order to use it as a source or target connection. More information on enabling CORS can be found in the {0}
        azDocLinkText: "Azure說明文件", // Azure Documentation.
        providers: {
            azureBlob: {
                title: "Azure Blob存儲空間", // Azure Blob Storage
                description: "",
                accountName: {
                    title: "帳號名", // Account Name
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                    description: "",
                },
                containerName: {
                    title: "容器名稱", // Container Name
                    description: "",
                },
                sas: {
                    title: "SAS", // SAS
<<<<<<< HEAD
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
=======
                    description: "用於驗證Blob存儲帳戶的共享存取簽名標記" // Shared access signature used to authenticate to the blob storage account
                },
                createContainer: {
                    title: "新增容器", // Create Container
                    description: "新增blob容器（如果還不存在時）" // Creates the blob container if it does not already exist
                }
            },
            bing: {
                title: "BING 圖片搜索", // Bing Image Search
                options: "BING 圖像搜索選項", // Bing Image Search Options
                apiKey: "API密鑰", // API Key
                query: "查詢", // Query
                aspectRatio: {
                    title: "長寬比", // Aspect Ratio
                    all: "所有", // All
                    square: "矩形", // Square
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                    wide: "寬", // Wide
                    tall: "高" // Tall
                }
            },
            local: {
<<<<<<< HEAD
                title: "本地文件系統", // Local File System
                folderPath: "資料夾路徑", // Folder Path
                selectFolder: "選擇文件夾", // Select Folder
                chooseFolder: "選擇資料夾" // Choose Folder
=======
                title: "本地檔案系統", // Local File System
                folderPath: "資料夾路徑", // Folder Path
                selectFolder: "選擇資料夾", // Select Folder
                chooseFolder: "選取資料夾" // Choose Folder
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
            }
        }
    },
    editorPage: {
        width: "寬度", // Width
        height: "高度", // Height
        tagged: "已標記", // Tagged
<<<<<<< HEAD
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
=======
        visited: "已檢視", // Visited
        toolbar: {
            select: "選擇 (V)", // Select (V)
            pan: "全景", // Pan
            drawRectangle: "繪製矩形", // Draw Rectangle
            drawPolygon: "繪製多邊形", // Draw Polygon
            copyRectangle: "複製矩形", // Copy Rectangle
            copy: "複製區域", // Copy Regions
            cut: "剪下區域", // Cut Regions
            paste: "貼上區域", // Paste Regions
            removeAllRegions: "刪除所有區域", // Remove All Regions
            previousAsset: "以前的圖像數據", // Previous Asset
            nextAsset: "下一個圖像數據", // Next Asset
            saveProject: "保存專案", // Save Project
            exportProject: "匯出專案", // Export Project
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
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
<<<<<<< HEAD
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
=======
                tooltip: "上一個框架" // Previous Frame
            },
            nextExpectedFrame: {
                tooltip: "下一個框架" // Next Frame
            }
        },
        help: {
            title: "切換輔助說明選項", // Toggle Help Menu
            escape: "離開輔助說明選項" // Escape Help Menu
        },
        assetError: "無法載入圖像數據", // Unable to load asset
        tags: {
            hotKey: {
                apply: "使用快捷鍵來反應標記", // Apply Tag with Hot Key
                lock: "用快捷鍵來鎖定標記" // Lock Tag with Hot Key
            },
            rename: {
                title: "重新命名標記", // Rename Tag
                confirmation: "您確定要重新命名此標記嗎？它將在所有圖像數據中被重新命名" // Are you sure you want to rename this tag? It will be renamed throughout all assets
            },
            delete: {
                title: "刪除標記", // Delete Tag
                confirmation: "您確定要刪除此標記嗎？它將在所有圖像數據中被刪除，並且只有此標記存在的任何區域也將被刪除" // Are you sure you want to delete this tag? It will be deleted throughout all assets and any regions where this is the only tag will also be deleted
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
            }
        },
        canvas: {
            removeAllRegions: {
<<<<<<< HEAD
                title: "刪除所有地區", // Remove All Regions
=======
                title: "刪除所有區域", // Remove All Regions
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                confirmation: "您確定要刪除所有區域嗎？" // Are you sure you want to remove all regions?
            }
        },
        messages: {
            enforceTaggedRegions: {
                title: "檢測到無效的區域", // Invalid region(s) detected
<<<<<<< HEAD
                description: "1個或多個區域尚未被標記。在繼續下一個資產之前，請確保所有區域均已標記。" // 1 or more regions have not been tagged.  Ensure all regions are tagged before continuing to next asset.
=======
                description: "一個或多個區域尚未被標記。在繼續下一個圖像數據之前，請確保所有區域均已標記。" // 1 or more regions have not been tagged.  Ensure all regions are tagged before continuing to next asset.
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
            }
        }
    },
    export: {
<<<<<<< HEAD
        title: "出口", // Export
        settings: "匯出設定", // Export Settings
        saveSettings: "保存導出設置", // Save Export Settings
=======
        title: "匯出", // Export
        settings: "匯出設定", // Export Settings
        saveSettings: "保存匯出設定", // Save Export Settings
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
        providers: {
            common: {
                properties: {
                    assetState: {
<<<<<<< HEAD
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
=======
                        title: "圖像數據狀態", // Asset State
                        description: "匯出項目中包括哪些圖像數據", // Which assets to include in the export
                        options: {
                            all: "所有圖像數據", // All Assets
                            visited: "只有已檢視的圖像數據", // Only Visited Assets
                            tagged: "只有已標記的圖像數據" // Only tagged Assets
                        }
                    },
                    testTrainSplit: {
                        title: "測試/訓練分割", // Test / Train Split
                        description: "測試訓練分割以用於匯出數據" // The test train split to use for exported data
                    },
                    includeImages: {
                        title: "包含圖像", // Include Images
                        description: "是否在目標連接中包括二進位圖像數據" // Whether or not to include binary image assets in target connection
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                    }
                }
            },
            vottJson: {
                displayName: "VoTT JSON" // VoTT JSON
            },
            azureCV: {
<<<<<<< HEAD
                displayName: "Azure自定義視覺服務", // Azure Custom Vision Service
                regions: {
                    australiaEast: "東澳大利亞", // Australia East
                    centralIndia: "印度中部", // Central India
                    eastUs: "美國東部", // East US
                    eastUs2: "美國東部2", // East US 2
                    japanEast: "東日本", // Japan East
=======
                displayName: "Azure客製化視覺服務", // Azure Custom Vision Service
                regions: { // reference to https://azure.microsoft.com/zh-tw/global-infrastructure/geographies/ for official translation
                    australiaEast: "澳大利亞東部", // Australia East
                    centralIndia: "印度中部", // Central India
                    eastUs: "美國東部", // East US
                    eastUs2: "美國東部 2", // East US 2
                    japanEast: "日本東部", // Japan East
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                    northCentralUs: "美國中北部", // North Central US
                    northEurope: "北歐", // North Europe
                    southCentralUs: "美國中南部", // South Central US
                    southeastAsia: "東南亞", // Southeast Asia
                    ukSouth: "英國南部", // UK South
<<<<<<< HEAD
                    westUs2: "美國西部2", // West US 2
=======
                    westUs2: "美國西部 2", // West US 2
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                    westEurope: "西歐" // West Europe
                },
                properties: {
                    apiKey: {
                        title: "API密鑰" // API Key
                    },
                    region: {
                        title: "區域", // Region
<<<<<<< HEAD
                        description: "部署服務的Azure區域" // The Azure region where your service is deployed
=======
                        description: "部署服務的Azure地區" // The Azure region where your service is deployed
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                    },
                    classificationType: {
                        title: "分類類型", // Classification Type
                        options: {
<<<<<<< HEAD
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
=======
                            multiLabel: "每個圖像多個標記", // Multiple tags per image
                            multiClass: "每個圖像一個標記" // Single tag per image
                        }
                    },
                    name: {
                        title: "專案名" // Project Name
                    },
                    description: {
                        title: "專案簡介" // Project Description
                    },
                    domainId: {
                        title: "領域" // Domain
                    },
                    newOrExisting: {
                        title: "新專案或既有專案", // New or Existing Project
                        options: {
                            new: "新專案", // New Project
                            existing: "既有專案" // Existing Project
                        }
                    },
                    projectId: {
                        title: "專案名稱" // Project Name
                    },
                    projectType: {
                        title: "專案類型", // Project Type
                        options: {
                            classification: "分類", // Classification
                            objectDetection: "物件偵測" // Object Detection
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
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
<<<<<<< HEAD
                    title: "導出未分配", // Export Unassigned
                    description: "是否在導出的數據中包括未分配的標籤" // Whether or not to include unassigned tags in exported data
=======
                    title: "匯出未指定的項目", // Export Unassigned
                    description: "是否在已匯出的數據中包括未指定的標記" // Whether or not to include unassigned tags in exported data
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                }
            },
            cntk: {
                displayName: "Microsoft Cognitive Toolkit（CNTK)" // Microsoft Cognitive Toolkit (CNTK)
            },
            csv: {
<<<<<<< HEAD
                displayName: "逗號分隔值 (CSV)" // Comma Separated Values (CSV)
            }
        },
        messages: {
            saveSuccess: "成功保存導出設置" // Successfully saved export settings
=======
                displayName: "逗號分隔格式 (CSV)" // Comma Separated Values (CSV)
            }
        },
        messages: {
            saveSuccess: "已成功保存匯出設定" // Successfully saved export settings
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
        }
    },
    activeLearning: {
        title: "主動學習", // Active Learning
        form: {
            properties: {
                modelPathType: {
                    title: "模型提供者", // Model Provider
<<<<<<< HEAD
                    description: "從何處加載訓練模型", // Where to load the training model from
                    options: {
                        preTrained: "預先訓練Coco SSD", // Pre-trained Coco SSD
                        customFilePath: "自定義（文件路徑）", // Custom (File path)
                        customWebUrl: "自訂 (URL)" // Custom (Url)
=======
                    description: "從何處載入訓練模型", // Where to load the training model from
                    options: {
                        preTrained: "預先訓練Coco SSD", // Pre-trained Coco SSD
                        customFilePath: "客製化定義（檔案路徑）", // Custom (File path)
                        customWebUrl: "客製化 (URL)" // Custom (Url)
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                    }
                },
                autoDetect: {
                    title: "自動偵測", // Auto Detect
<<<<<<< HEAD
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
=======
                    description: "在圖像數據之間瀏覽時是否自動進行預測" // Whether or not to automatically make predictions as you navigate between assets
                },
                modelPath: {
                    title: "模型路徑", // Model path
                    description: "從本地檔案系統中選擇模型" // Select a model from your local file system
                },
                modelUrl: {
                    title: "模型網址", // Model URL
                    description: "從公共網址載入模型" // Load your model from a public web URL
                },
                predictTag: {
                    title: "預測標記", // Predict Tag
                    description: "是否在預測中自動包含標記" // Whether or not to automatically include tags in predictions
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
                }
            }
        },
        messages: {
<<<<<<< HEAD
            loadingModel: "正在加載主動學習模型...", // Loading active learning model...
            errorLoadModel: "加載主動學習模型時出錯", // Error loading active learning model
            saveSuccess: "成功保存了主動學習設置" // Successfully saved active learning settings
        }
    },
    profile: {
        settings: "個人資料設置" // Profile Settings
=======
            loadingModel: "正在載入主動學習模型...", // Loading active learning model...
            errorLoadModel: "載入主動學習模型時出現錯誤", // Error loading active learning model
            saveSuccess: "已成功保存主動學習設定" // Successfully saved active learning settings
        }
    },
    profile: {
        settings: "個人資料設定" // Profile Settings
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
    },
    errors: {
        unknown: {
            title: "未知錯誤", // Unknown Error
<<<<<<< HEAD
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
=======
            message: "該應用程式遇到未知錯誤。請再試一遍。" // The app encountered an unknown error. Please try again.
        },
        projectUploadError: {
            title: "上傳檔案時出現錯誤", // Error Uploading File
            message: "上傳檔案時出現錯誤。請確認檔案格式正確，然後重試。" // There was an error uploading the file. Please verify the file is of the correct format and try again.
        },
        genericRenderError: {
            title: "載入應用程序時出現錯誤", // Error Loading Application
            message: "描繪應用程序時發生錯誤。請再試一遍" // An error occured while rendering the application. Please try again
        },
        projectInvalidSecurityToken: {
            title: "載入專案文件時出現錯誤", // Error loading project file
            message: "專案使用的安全性認證無效。請驗證是否在您的應用程式設定中正確的設定了專案的安全性認證" // The security token referenced by the project is invalid. Verify that the security token for the project has been set correctly within your application settings
        },
        projectInvalidJson: {
            title: "解析專案文件時出現錯誤", // Error parsing project file
            message: "所選擇的專案文件不包含有效的JSON格式。請確認該專案檔案並且重試。" // The selected project files does not contain valid JSON. Please check the file any try again.
        },
        projectDeleteError: {
            title: "刪除專案時出現錯誤", // Error deleting project
            message: "刪除專案時發生錯誤。請確認專案檔案和安全性認證是否存在，然後重試" // An error occured while deleting the project. Validate the project file and security token exist and try again
        },
        securityTokenNotFound: {
            title: "加載專案檔案時出現錯誤", // Error loading project file
            message: "在當前的應用程式設定中找不到該專案所使用的安全性認證。請確認安全性認證是否存在，然後嘗試重新載入專案。" // The security token referenced by the project cannot be found in your current application settings. Verify the security token exists and try to reload the project.
        },
        canvasError: {
            title: "載入畫面時出現錯誤", // Error loading canvas
            message: "載入畫面時發生錯誤，請檢查專案的圖像數據，然後重試。" // There was an error loading the canvas, check the project's assets and try again.
        },
        importError: {
            title: "匯入V1格式專案時出現錯誤", // Error importing V1 project
            message: "匯入V1格式專案時出現錯誤。請檢查專案檔案，然後重試" // There was an error importing the V1 project. Check the project file and try again
        },
        pasteRegionTooBigError: {
            title: "貼上區域時發生錯誤", // Error pasting region
            message: "此區域對於本圖像數據來說太大了。請嘗試複製其他的區域" // Region too big for this asset. Try copying another region
        },
        exportFormatNotFound: {
            title: "匯出專案時出現錯誤", // Error exporting project
            message: "專案設定中缺少匯出格式。請在匯出設定畫面中選擇一種匯出格式。" // Project is missing export format.  Please select an export format in the export setting page.
        },
        activeLearningPredictionError: {
            title: "主動學習錯誤", // Active Learning Error
            message: "在預測當前圖像數據中的區域時發生錯誤。請確認您的主動學習相關設定，然後重試" // An error occurred while predicting regions in the current asset. Please verify your active learning configuration and try again
>>>>>>> 208cfb737eea75257ffb5bb20d860ba1c2762ab5
        },
    },
};
