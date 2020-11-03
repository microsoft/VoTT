import axios from "axios";
import { BingImageSearch, IBingImageSearchOptions, BingImageSearchAspectRatio } from "./bingImageSearch";
import { IAsset, AssetType, AssetState } from "../../models/applicationState";
import MD5 from "md5.js";

describe("Bing Image Search", () => {
    const bingImageSearchOptionsBasic: IBingImageSearchOptions = {
        apiKey: "ABC123",
        query: "Waterfalls",
        aspectRatio: BingImageSearchAspectRatio.All,
    };
    const providerBasic = new BingImageSearch(bingImageSearchOptionsBasic);

    const assetsBasic = [
        { contentUrl: "http://images.com/image1.jpg" },
        { contentUrl: "http://images.com/image2.jpg" },
        { contentUrl: "http://images.com/image3.jpg" },
        { contentUrl: "http://images.com/image4.jpg" },
    ];

    const bingImageSearchOptionsOldApi: IBingImageSearchOptions = {
        apiKey: "",
        query: "Waterfalls",
        aspectRatio: BingImageSearchAspectRatio.All,
    };
    const providerOldApi = new BingImageSearch(bingImageSearchOptionsOldApi);

    const bingImageSearchOptionsNewApi: IBingImageSearchOptions = {
        apiKey: "",
        query: "Waterfalls",
        aspectRatio: BingImageSearchAspectRatio.All,
    };
    const providerNewApi = new BingImageSearch(bingImageSearchOptionsNewApi);

    axios.get = jest.fn(() => {
        return Promise.resolve({
            data: {
                value: assetsBasic,
            },
        });
    });

    it.each([
        [providerBasic, bingImageSearchOptionsBasic],
        [providerOldApi, bingImageSearchOptionsOldApi],
        [providerNewApi, bingImageSearchOptionsNewApi]])
        ("calls the Bing image search API", async (provider, options) => {

            // tslint:disable-next-line:max-line-length
            const expectedUrl = `https://api.cognitive.microsoft.com/bing/v7.0/images/search?q=${options.query}&aspect=${options.aspectRatio}`;
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

        const assets = await providerBasic.getAssets();
        expect(assets.length).toEqual(assets.length);
        expect(assets[0]).toEqual(expectedAsset);
    });
});
