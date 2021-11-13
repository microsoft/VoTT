import axios from "axios";
import {
    BingImageSearch,
    IBingImageSearchOptions,
    BingImageSearchAspectRatio,
    BingImageSearchSize,
    BingImageSearchLicenseType,
} from "./bingImageSearch";
import { IAsset, AssetType, AssetState } from "../../models/applicationState";
import MD5 from "md5.js";

describe("Bing Image Search", () => {
    const defaultOptions: IBingImageSearchOptions = {
        apiKey: "ABC123",
        query: "Waterfalls",
        aspectRatio: BingImageSearchAspectRatio.All,
        size: BingImageSearchSize.All,
        licenseType: BingImageSearchLicenseType.All,
    };

    const assets = [
        { contentUrl: "http://images.com/image1.jpg" },
        { contentUrl: "http://images.com/image2.jpg" },
        { contentUrl: "http://images.com/image3.jpg" },
        { contentUrl: "http://images.com/image4.jpg" },
    ];

    beforeEach(() => {
        axios.get = jest.fn(() => {
            return Promise.resolve({
                data: {
                    value: assets,
                },
            });
        }) as any;
    });

    it("calls the Bing image search API with default API url", async () => {
        const provider = new BingImageSearch(defaultOptions);
        // tslint:disable-next-line:max-line-length
        const expectedUrl = `${BingImageSearch.DefaultApiUrl}/v7.0/images/search?q=${defaultOptions.query}&aspect=${defaultOptions.aspectRatio}&license=${defaultOptions.licenseType}&size=${defaultOptions.size}`;
        const expectedHeaders = {
            headers: {
                "Ocp-Apim-Subscription-Key": defaultOptions.apiKey,
                "Accept": "application/json",
            },
        };

        await provider.getAssets();
        expect(axios.get).toBeCalledWith(expectedUrl, expectedHeaders);
    });

    it("calls the Bing image search API with custom configuration", async () => {
        const options: IBingImageSearchOptions = {
            ...defaultOptions,
            apiKey: "XYZ123",
            query: "Custom",
            endpoint: "https://api.bing.microsoft.com",
            aspectRatio: BingImageSearchAspectRatio.Square,
            licenseType: BingImageSearchLicenseType.Public,
            size: BingImageSearchSize.Large,
        };

        const provider = new BingImageSearch(options);

        // tslint:disable-next-line:max-line-length
        const expectedUrl = `${options.endpoint}/v7.0/images/search?q=${options.query}&aspect=${options.aspectRatio}&license=${options.licenseType}&size=${options.size}`;
        const expectedHeaders = {
            headers: {
                "Ocp-Apim-Subscription-Key": options.apiKey,
                "Accept": "application/json",
            },
        };

        await provider.getAssets();
        expect(axios.get).toBeCalledWith(expectedUrl, expectedHeaders);
    });

    it("returns parsed image assets", async () => {
        const expectedAsset: IAsset = {
            id: new MD5().update("http://images.com/image1.jpg").digest("hex"),
            format: "jpg",
            name: "image1.jpg",
            path: "http://images.com/image1.jpg",
            type: AssetType.Image,
            state: AssetState.NotVisited,
            size: null,
        };

        const provider = new BingImageSearch(defaultOptions);
        const assets = await provider.getAssets();
        expect(assets.length).toEqual(assets.length);
        expect(assets[0]).toEqual(expectedAsset);
    });
});
