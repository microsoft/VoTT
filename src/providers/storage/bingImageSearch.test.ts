import axios from "axios";
import { BingImageSearch, IBingImageSearchOptions, BingImageSearchAspectRatio } from "./bingImageSearch";
import { IAsset, AssetType, AssetState } from "../../models/applicationState";
import MD5 from "md5.js";
import MockAdapter from "axios-mock-adapter";

describe("Bing Image Search", () => {
    const options: IBingImageSearchOptions = {
        apiKey: "ABC123",
        query: "Waterfalls",
        aspectRatio: BingImageSearchAspectRatio.All,
    };
    const provider = new BingImageSearch(options);

    const assets = [
        { contentUrl: "http://images.com/image1.jpg" },
        { contentUrl: "http://images.com/image2.jpg" },
        { contentUrl: "http://images.com/image3.jpg" },
        { contentUrl: "http://images.com/image4.jpg" },
    ];

    const axiosMock = new MockAdapter(axios);

    it("calls the Bing image search API", async () => {
        // tslint:disable-next-line:max-line-length
        const expectedUrl = `https://api.cognitive.microsoft.com/bing/v7.0/images/search?q=${options.query}&aspect=${options.aspectRatio}`;
        axiosMock.onGet(expectedUrl).reply(200, { value: assets, });

        const expectedHeaders = {
            "Ocp-Apim-Subscription-Key": options.apiKey,
            "Accept": "application/json",
        };

        await provider.getAssets();
        expect(axiosMock.history.get[0].url).toEqual(expectedUrl);
        expect(axiosMock.history.get[0].headers).toEqual(expectedHeaders);
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

        const assets = await provider.getAssets();
        expect(assets.length).toEqual(assets.length);
        expect(assets[0]).toEqual(expectedAsset);
    });
});
