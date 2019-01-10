import axios from "axios";
import { IAsset, AssetType } from "../../models/applicationState";
import { IAssetProvider } from "./assetProviderFactory";
import { AssetService } from "../../services/assetService";
import Guard from "../../common/guard";

export interface IBingImageSearchOptions {
    apiKey: string;
    query: string;
    aspectRatio: BingImageSearchAspectRatio;
}

export enum BingImageSearchAspectRatio {
    Square = "Square",
    Wide = "Wide",
    Tall = "Tall",
    All = "All",
}

export class BingImageSearch implements IAssetProvider {
    private static SEARCH_URL = "https://api.cognitive.microsoft.com/bing/v7.0/images/search";

    constructor(private options: IBingImageSearchOptions) {
        Guard.null(options);
    }

    public async getAssets(): Promise<IAsset[]> {
        const query = {
            q: this.options.query,
            aspect: this.options.aspectRatio,
        };

        const url = `${BingImageSearch.SEARCH_URL}?${this.createQueryString(query)}`;

        const response = await axios.get(url, {
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

    private createQueryString(object: any): string {
        const parts: any[] = [];

        for (const key of Object.getOwnPropertyNames(object)) {
            parts.push(`${key}=${encodeURIComponent(object[key])}`);
        }

        return parts.join("&");
    }
}
