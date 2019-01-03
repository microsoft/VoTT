import HtmlFileReader from "./htmlFileReader";
import MockFactory from "./mockFactory";
import { AssetService } from "../services/assetService";

describe("Html File Reader", () => {
    it("Resolves promise after successfully reading file", async () => {
        const expectedText = "test file contents";
        const blob = new Blob([expectedText], { type: "text/plain" });
        const file = new File([blob], "test.txt");

        const actualText = await HtmlFileReader.readAsText(file);
        expect(actualText).toEqual(expectedText);
    });

    it("Throws error with null file value", () => {
        expect(() => HtmlFileReader.readAsText(null)).toThrowError();
    });

    it("Loads attributes for HTML 5 video", async () => {
        const expected = {
            width: 1920,
            height: 1080,
            duration: 1000,
        };

        document.createElement = jest.fn(() => {
            const element: any = {
                videoWidth: expected.width,
                videoHeight: expected.height,
                duration: expected.duration,
                onloadedmetadata: jest.fn(),
            };

            setTimeout(() => {
                element.onloadedmetadata();
            }, 100);

            return element;
        });

        const videoAsset = AssetService.createAssetFromFilePath("https://server.com/video.mp4");
        const result = await HtmlFileReader.readAssetAttributes(videoAsset);

        expect(result.width).toEqual(expected.width);
        expect(result.height).toEqual(expected.height);
        expect(result.duration).toEqual(expected.duration);
    });

    it("Loads attributes for an image asset", async () => {
        const expected = {
            width: 1920,
            height: 1080,
        };

        document.createElement = jest.fn(() => {
            const element: any = {
                naturalWidth: expected.width,
                naturalHeight: expected.height,
                onload: jest.fn(),
            };

            setTimeout(() => {
                element.onload();
            }, 100);

            return element;
        });

        const imageAsset = AssetService.createAssetFromFilePath("https://server.com/image.jpg");
        const result = await HtmlFileReader.readAssetAttributes(imageAsset);

        expect(result.width).toEqual(expected.width);
        expect(result.height).toEqual(expected.height);
    });
});
