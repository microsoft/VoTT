import { ExportAssetState } from "../providers/export/exportProvider";

/**
 * @name - Application State
 * @description - Defines the root level application state
 * @member appSettings - Application wide settings
 * @member connections - Global list of connections available to application
 * @member recentProjects - List of recently used projects
 * @member currentProject - The active project being edited
 * @member appError - error in the app if any
 */
export interface IApplicationState {
    appSettings: IAppSettings;
    connections: IConnection[];
    recentProjects: IProject[];
    currentProject: IProject;
    appError?: IAppError;
}

/**
 * @name - Application Error
 * @description - Defines error detail
 * @member title - title of the error to display
 * @member message - message of the error to display
 * @member errorCode - error category
 */
export interface IAppError {
    errorCode: ErrorCode;
    message: any;
    title?: string;
}

/**
 * Enum of supported error codes
 */
export enum ErrorCode {
    // Note that the value of the enum is in camelCase while
    // the enum key is in Pascal casing
    Unknown = "unknown",
    GenericRenderError = "genericRenderError",
    ProjectInvalidJson = "projectInvalidJson",
    ProjectInvalidSecurityToken = "projectInvalidSecurityToken",
    ProjectDuplicateName = "projectDuplicateName",
    ProjectUploadError = "projectUploadError",
    ProjectDeleteError = "projectDeleteError",
    SecurityTokenNotFound = "securityTokenNotFound",
    ExportFormatNotFound = "exportFormatNotFound",
    CanvasError = "canvasError",
    V1ImportError = "v1ImportError",
    PasteRegionTooBigError = "pasteRegionTooBigError",
}

/**
 * Base application error
 */
export class AppError extends Error implements IAppError {
    public errorCode: ErrorCode;
    public message: string;
    public title?: string;

    constructor(errorCode: ErrorCode, message: string, title: string = null) {
        super(message);
        this.errorCode = errorCode;
        this.message = message;
        this.title = title;
    }
}

/**
 * @name - Provider Options
 * @description - Property map of key values used within a export / asset / storage provider
 */
export interface IProviderOptions {
    [key: string]: any;
}

/**
 * @name - Application settings
 * @description - Defines the root level configuration options for the application
 * @member devToolsEnabled - Whether dev tools are current open and enabled
 * @member securityTokens - Token used to encrypt sensitive project settings
 */
export interface IAppSettings {
    devToolsEnabled: boolean;
    securityTokens: ISecurityToken[];
}

/**
 * @name - Project
 * @description - Defines the structure of a VoTT project
 * @member id - Unique identifier
 * @member name - User defined name
 * @member securityToken - The Base64 encoded token used to encrypt sensitive project data
 * @member description - User defined description
 * @member tags - User defined list of tags
 * @member sourceConnection - Full source connection details
 * @member targetConnection - Full target connection details
 * @member exportFormat - Full export format definition
 * @member assets - Map of assets within a project
 * @member autoSave - Whether or not the project will automatically save updates to the underlying target
 */
export interface IProject {
    id: string;
    name: string;
    version: string;
    securityToken: string;
    description?: string;
    tags: ITag[];
    sourceConnection: IConnection;
    targetConnection: IConnection;
    exportFormat: IExportFormat;
    videoSettings: IProjectVideoSettings;
    autoSave: boolean;
    assets?: { [index: string]: IAsset };
    lastVisitedAssetId?: string;
}

/**
 * @name - FileInfo
 * @description - Defines the file information and content for V1 projects
 * @member content - The content of a file (JSON string)
 * @member file - The File object point to the V1 project file
 */
export interface IFileInfo {
    content: string | ArrayBuffer;
    file: File;
}

/**
 * @name - Tag
 * @description - Defines the structure of a VoTT tag
 * @member name - User defined name
 * @member color - User editable color associated to tag
 */
export interface ITag {
    name: string;
    color: string;
}

/**
 * @enum LOCAL - Local storage type
 * @enum CLOUD - Cloud storage type
 * @enum OTHER - Any other storage type
 */
export enum StorageType {
    Local = "local",
    Cloud = "cloud",
    Other = "other",
}

/**
 * @name - Connection
 * @description - Defines a reusable data source definition for projects
 * @member id - Unique identifier for connection
 * @member name - User defined name
 * @member description - User defined short description
 * @member providerType - The underlying storage type (Local File System, Azure Blob Storage, etc)
 * @member providerOptions - Provider specific options used to connect to the data source
 */
export interface IConnection {
    id: string;
    name: string;
    description?: string;
    providerType: string;
    providerOptions: IProviderOptions | ISecureString;
}

export interface IExportProviderOptions extends IProviderOptions {
    assetState: ExportAssetState;
}

/**
 * @name - Export Format
 * @description - Defines the settings for how project data is exported into commonly used format
 * @member id - Unique identifier for export format
 * @member name - Name of export format
 * @member providerType - The export format type (TF Records, YOLO, CVS, etc)
 * @member providerOptions - The provider specific option required to export data
 */
export interface IExportFormat {
    providerType: string;
    providerOptions: IExportProviderOptions | ISecureString;
}

/**
 * @name - Video Tagging Settings for the project
 * @description - Defines the video settings within a VoTT project
 * @member frameExtractionRate - Extraction rate for a video (number of frames per second of video)
 */
export interface IProjectVideoSettings {
    frameExtractionRate: number;
}

/**
 * @name - Asset Video Settings
 * @description - Defines the settings for video assets
 * @member shouldAutoPlayVideo - true if the video should auto play when loaded, false otherwise
 * @member posterSource - Source location of the image to display when the video is not playing,
 * null for default (first frame of video)
 */
export interface IAssetVideoSettings {
    shouldAutoPlayVideo: boolean;
    posterSource: string;
    shouldShowPlayControls: boolean;
}

/**
 * @name - Asset
 * @description - Defines an asset within a VoTT project
 * @member id - Unique identifier for asset
 * @member type - Type of asset (Image, Video, etc)
 * @member name - Generated name for asset
 * @member path - Relative path to asset within the underlying data source
 * @member size - Size / dimensions of asset
 * @member format - The asset format (jpg, png, mp4, etc)
 */
export interface IAsset {
    id: string;
    type: AssetType;
    state: AssetState;
    name: string;
    path: string;
    size: ISize;
    format?: string;
    timestamp?: number;
    parent?: IAsset;
}

/**
 * @name - Asset Metadata
 * @description - Format to store asset metadata for each asset within a project
 * @member asset - References an asset within the project
 * @member regions - The list of regions drawn on the asset
 */
export interface IAssetMetadata {
    asset: IAsset;
    regions: IRegion[];
    version: string;
}

/**
 * @name - Size
 * @description - Defines the size and/or diminsion for an asset
 * @member width - The actual width of an asset
 * @member height - The actual height of an asset
 */
export interface ISize {
    width: number;
    height: number;
}

/**
 * @name - Region
 * @description - Defines a region within an asset
 * @member id - Unique identifier for this region
 * @member type - Defines the type of region
 * @member tags - Defines a list of tags applied to a region
 * @member points - Defines a list of points that define a region
 */
export interface IRegion {
    id: string;
    type: RegionType;
    tags: string[];
    points?: IPoint[];
    boundingBox?: IBoundingBox;
}

/**
 * @name - Bounding Box
 * @description - Defines the tag usage within a bounding box region
 * @member left - Defines the left x boundary for the start of the bounding box
 * @member top - Defines the top y boundary for the start of the boudning box
 * @member width - Defines the width of the bounding box
 * @member height - Defines the height of the bounding box
 */
export interface IBoundingBox {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * @name - Point
 * @description - Defines a point / coordinate within a region
 * @member x - The x value relative to the asset
 * @member y - The y value relative to the asset
 */
export interface IPoint {
    x: number;
    y: number;
}

/**
 * @name - Asset Type
 * @description - Defines the type of asset within a project
 * @member Image - Specifies an asset as an image
 * @member Video - Specifies an asset as a video
 */
export enum AssetType {
    Unknown = 0,
    Image = 1,
    Video = 2,
    VideoFrame = 3,
    TFRecord = 4,
}

/**
 * @name - Asset State
 * @description - Defines the state of the asset with regard to the tagging process
 * @member NotVisited - Specifies as asset that has not yet been visited or tagged
 * @member Visited - Specifies an asset has been visited, but not yet tagged
 * @member Tagged - Specifies an asset has been visited and tagged
 */
export enum AssetState {
    NotVisited = 0,
    Visited = 1,
    Tagged = 2,
}

/**
 * @name - Region Type
 * @description - Defines the region type within the asset metadata
 * @member Square - Specifies a region as a square
 * @member Rectangle - Specifies a region as a rectangle
 * @member Polygon - Specifies a region as a multi-point polygon
 */
export enum RegionType {
    Polyline = "POLYLINE",
    Point = "POINT",
    Rectangle = "RECTANGLE",
    Polygon = "POLYGON",
    Square = "SQUARE",
}

export enum EditorMode {
    Rectangle = "RECT",
    Polygon = "POLYGON",
    Polyline = "POLYLINE",
    Point = "POINT",
    Select = "SELECT",
    CopyRect = "COPYRECT",
    None = "NONE",
}

export interface ISecureString {
    encrypted: string;
}

export interface ISecurityToken {
    name: string;
    key: string;
}

export interface ITFRecordMetadata {
    width: number;
    height: number;
    xminArray: number[];
    yminArray: number[];
    xmaxArray: number[];
    ymaxArray: number[];
    textArray: string[];
}
