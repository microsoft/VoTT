import CanvasHelpers from "./canvasHelpers";
import MockFactory from "../../../../common/mockFactory";
import { RegionType, IRegion } from "../../../../models/applicationState";
import { RegionDataType, RegionData } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";

describe("Canvas Helpers", () => {
    it("Adds a tag to list", () => {
        const tags = MockFactory.createTestTags().map((tag) => tag.name);
        const originalLength = tags.length;
        const newTag = MockFactory.createTestTag("New Tag");
        CanvasHelpers.toggleTag(
            tags,
            newTag.name,
        );
        expect(tags).toHaveLength(originalLength + 1);
        expect(tags[tags.length - 1]).toEqual(newTag.name);
    });

    it("Removes a tag from list", () => {
        const tags = MockFactory.createTestTags().map((tag) => tag.name);
        const originalLength = tags.length;
        const originalFirstTag = tags[0];
        CanvasHelpers.toggleTag(
            tags,
            tags[0],
        );
        expect(tags).toHaveLength(originalLength - 1);
        expect(tags[0]).not.toEqual(originalFirstTag);
    });

    it("Gets correct region data", () => {
        const expected = new RegionData(
            0, 0, 100, 100,
            [
                new Point2D(0, 0),
                new Point2D(1, 0),
                new Point2D(1, 1),
                new Point2D(0, 0),
            ],
            RegionDataType.Polygon,
        );

        const region: IRegion = {
            id: "test",
            boundingBox: {
                left: 0,
                top: 0,
                width: 100,
                height: 100,
            },
            points: [
                {
                    x: 0, y: 0,
                },
                {
                    x: 1, y: 0,
                },
                {
                    x: 1, y: 1,
                }, {
                    x: 0, y: 0,
                },
            ],
            type: RegionType.Polygon,
            tags: [],
        };
        expect(CanvasHelpers.getRegionData(region)).toEqual(expected);
    });

    it("Gets correct region data type", () => {
        expect(CanvasHelpers.regionTypeToType(RegionType.Rectangle)).toEqual(RegionDataType.Rect);
        expect(CanvasHelpers.regionTypeToType(RegionType.Polygon)).toEqual(RegionDataType.Polygon);
        expect(CanvasHelpers.regionTypeToType(RegionType.Point)).toEqual(RegionDataType.Point);
        expect(CanvasHelpers.regionTypeToType(RegionType.Polyline)).toEqual(RegionDataType.Polyline);
        expect(CanvasHelpers.regionTypeToType(null)).toBeUndefined();
    });

    it("Duplicates and moves a region", () => {
        const regions = MockFactory.createTestRegions();
        const duplicates = CanvasHelpers.duplicateRegionsAndMove([regions[0]], regions);
        expect(duplicates[0]).toMatchObject({
            ...regions[0],
            id: expect.any(String),
            boundingBox: {
                ...regions[0].boundingBox,
                left: regions[0].boundingBox.left + CanvasHelpers.pasteMargin,
                top: regions[0].boundingBox.top + CanvasHelpers.pasteMargin,
            },
            points: regions[0].points.map((p) => {
                return {
                    x: p.x + CanvasHelpers.pasteMargin,
                    y: p.y + CanvasHelpers.pasteMargin,
                };
            }),
        });
    });
});
