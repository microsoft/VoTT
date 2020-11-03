import axios from "axios";
import { IAsset, AssetType } from "../../models/applicationState";
import { IAssetProvider } from "./assetProviderFactory";
import { AssetService } from "../../services/assetService";
import Guard from "../../common/guard";
import { createQueryString } from "../../common/utils";

/**
 * Options for Bing Image Search
 * @member endpoint - The endpoint to use for the Bing Search API
 * @member apiKey - Bing Search API Key (Cognitive Services)
 * @member query - Query for Bing Search
 * @member aspectRatio - Aspect Ratio for desired images
 */
export interface IBingImageSearchOptions {
    endpoint?: string;
    apiKey: string;
    query: string;
    aspectRatio: BingImageSearchAspectRatio;
    size?: BingImageSearchSize,
    licenseType?: BingImageSearchLicenseType;
}

/**
 * Aspect Ratio for Bing Image Search
 */
export enum BingImageSearchAspectRatio {
    Square = "Square",
    Wide = "Wide",
    Tall = "Tall",
    All = "All",
}

export enum BingImageSearchLicenseType {
    All = "All",
    Any = "Any",
    Public = "Public",
    Share = "Share",
    ShareCommercially = "ShareCommercially",
    Modify = "Modify",
    ModifyCommercially = "ModifyCommercially",
}

export enum BingImageSearchSize {
    All = "All",
    Small = "Small",
    Medium = "Medium",
    Large = "Large",
    Wallpaper = "Wallpaper",
}

/**
 * Asset Provider for Bing Image Search
 */
export class BingImageSearch implements IAssetProvider {
    private static SEARCH_URL = "https://api.cognitive.microsoft.com/bing";

    constructor(private options: IBingImageSearchOptions) {
        Guard.null(options);
    }

    /**
     * Retrieves assets from Bing Image Search based on options provided
     */
    public async getAssets(): Promise<IAsset[]> {
        const query = {
            q: this.options.query,
            aspect: this.options.aspectRatio,
            license: this.options.licenseType || BingImageSearchLicenseType.All,
            size: this.options.size || BingImageSearchSize.All,
        };

        const baseUrl = this.options.endpoint || BingImageSearch.SEARCH_URL;
        const apiUrl = `${baseUrl}/v7.0/images/search?${createQueryString(query)}`;

        const response = await axios.get(apiUrl, {
            headers: {
                "Ocp-Apim-Subscription-Key": this.options.apiKey,
                "Accept": "application/json",
            },
        });

        const items = response.data.value.map((item) => item.contentUrl);

        return items
            .map((filePath) => AssetService.createAssetFromFilePath(filePath))
            .filter((asset) => asset.type !== AssetType.Unknown);
    }
}
