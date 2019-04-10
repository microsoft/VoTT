import { createContentBoundingBox, createLandscapeBoundingBox, createPortraitBoundingBox } from "./layout";
import { IGenericContentSource } from "../react/components/common/assetPreview/assetPreview";

describe("Layout Utils", () => {
    describe("createLandscapeBoundingBox", () => {
        it("creates a landscape sized bounding box", () => {
            const contentSource: IGenericContentSource = {
                offsetWidth: 1080,
                offsetHeight: 1080,
                offsetTop: 0,
                offsetLeft: 0,
                width: 800,
                height: 450,
            };

            const aspectRatio = contentSource.width / contentSource.height;

            const result = createLandscapeBoundingBox(contentSource, aspectRatio);
            expect(result).toEqual({
                width: 1080,
                height: 607.5,
                top: 236.25,
                left: 0,
            });
        });
    });

    describe("createPortraitBoundingBox", () => {
        it("creates a portrait sized bounding box", () => {
            const contentSource: IGenericContentSource = {
                offsetWidth: 1080,
                offsetHeight: 1080,
                offsetTop: 0,
                offsetLeft: 0,
                width: 600,
                height: 800,
            };

            const aspectRatio = contentSource.width / contentSource.height;

            const result = createPortraitBoundingBox(contentSource, aspectRatio);
            expect(result).toEqual({
                width: 810,
                height: 1080,
                top: 0,
                left: 135,
            });
        });
    });

    describe("createContentBoundingBox", () => {
        it("creates landscape sized bounding box for landscape image", () => {
            const contentSource: IGenericContentSource = {
                offsetWidth: 1080,
                offsetHeight: 1080,
                offsetTop: 0,
                offsetLeft: 0,
                width: 800,
                height: 450,
            };

            const result = createContentBoundingBox(contentSource);
            expect(result).toEqual({
                width: 1080,
                height: 607.5,
                top: 236.25,
                left: 0,
            });
        });

        it("creates portrait sized bounding box for landscape image", () => {
            const contentSource: IGenericContentSource = {
                offsetWidth: 1000,
                offsetHeight: 400,
                offsetTop: 0,
                offsetLeft: 0,
                width: 800,
                height: 450,
            };

            const result = createContentBoundingBox(contentSource);
            expect(result).toEqual({
                width: 711.1111111111111,
                height: 400,
                top: 0,
                left: 144.44444444444446,
            });
        });

        it("creates portrait sized bounding box for portrait image", () => {
            const contentSource: IGenericContentSource = {
                offsetWidth: 1080,
                offsetHeight: 1080,
                offsetTop: 0,
                offsetLeft: 0,
                width: 450,
                height: 800,
            };

            const result = createContentBoundingBox(contentSource);
            expect(result).toEqual({
                width: 607.5,
                height: 1080,
                top: 0,
                left: 236.25,
            });
        });

        it("creates landscape sized bounding box for portrait image", () => {
            const contentSource: IGenericContentSource = {
                offsetWidth: 300,
                offsetHeight: 800,
                offsetTop: 0,
                offsetLeft: 0,
                width: 300,
                height: 400,
            };

            const result = createContentBoundingBox(contentSource);
            expect(result).toEqual({
                width: 300,
                height: 400,
                top: 200,
                left: 0,
            });
        });
    });
});
