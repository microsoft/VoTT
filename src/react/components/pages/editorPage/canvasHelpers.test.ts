import CanvasHelpers from "./canvasHelpers";
import MockFactory from "../../../../common/mockFactory";
import { RegionType, IRegion, IBoundingBox } from "../../../../models/applicationState";
import { RegionDataType, RegionData } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";

describe("Canvas Helpers", () => {
    it("Adds a tag to list", () => {
        const tags = MockFactory.createTestTags().map((tag) => tag.name);
        const originalLength = tags.length;
        const newTag = MockFactory.createTestTag("New Tag");
        const toggled = CanvasHelpers.toggleTag(
            tags,
            newTag.name,
        );
        expect(toggled).toHaveLength(originalLength + 1);
        expect(toggled[toggled.length - 1]).toEqual(newTag.name);
    });

    it("Removes a tag from list", () => {
        const tags = MockFactory.createTestTags().map((tag) => tag.name);
        const originalLength = tags.length;
        const originalFirstTag = tags[0];
        const removed = CanvasHelpers.toggleTag(
            tags,
            tags[0],
        );
        expect(removed).toHaveLength(originalLength - 1);
        expect(removed[0]).not.toEqual(originalFirstTag);
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

    it("Creates a point array from a bounding box", () => {
        const boundingBox = {
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        };
        expect(CanvasHelpers.fromBoundingBox(boundingBox)).toEqual([
            {
                x: 0,
                y: 0,
            },
            {
                x: 100,
                y: 0,
            },
            {
                x: 100,
                y: 100,
            },
            {
                x: 0,
                y: 100,
            },
        ]);
    });

    it("Duplicates and moves a region", () => {
        const regions = MockFactory.createTestRegions();
        const duplicates = CanvasHelpers.duplicateRegionsAndMove([regions[0]], regions, 1000, 2000);
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

    function expectDefaultDuplication(left, top, width = 100, height = 100) {
        const regions = MockFactory.createTestRegions();
        const boundingBox: IBoundingBox = {
            left,
            top,
            width,
            height,
        };
        regions[0] = {
            ...regions[0],
            boundingBox,
            points: CanvasHelpers.fromBoundingBox(boundingBox),
        };
        const duplicates = CanvasHelpers.duplicateRegionsAndMove([regions[0]], regions, 1000, 1000);
        const expectedBoundingBox: IBoundingBox = {
            ...boundingBox,
            left: 0,
            top: 0,
        };
        expect(duplicates[0]).toMatchObject({
            ...regions[0],
            id: expect.any(String),
            boundingBox: expectedBoundingBox,
            points: CanvasHelpers.fromBoundingBox(expectedBoundingBox),
        });
    }

    it("Duplicates a region with coordinates out of range into the default location", () => {
        // Starting coordinates out of range
        expectDefaultDuplication(1001, 1001);
        // Starting left out of range
        expectDefaultDuplication(1001, 0);
        // Starting right out of range
        expectDefaultDuplication(0, 1001);
        // Both width and height put out of range
        expectDefaultDuplication(999, 999);
        // Width puts out of range
        expectDefaultDuplication(999, 0);
        // Height puts out of range
        expectDefaultDuplication(0, 999);
    });

    it("Throws error for region too big", () => {
        // Both width and height too big
        expect(() => expectDefaultDuplication(500, 500, 1001, 1001)).toThrowError();
        // Just width too big
        expect(() => expectDefaultDuplication(500, 500, 1001, 10)).toThrowError();
        // Just height too big
        expect(() => expectDefaultDuplication(500, 500, 10, 1001)).toThrowError();
        // Neither too big
        expect(() => expectDefaultDuplication(1001, 1001, 10, 10)).not.toThrowError();
    });

    it("Toggles a tag", () => {
        const tags = ["tag1", "tag2", "tag3"];
        expect(CanvasHelpers.toggleTag(tags, "tag1")).toEqual(["tag2", "tag3"]);
        expect(CanvasHelpers.toggleTag(tags, "tag4")).toEqual(["tag1", "tag2", "tag3", "tag4"]);
    });

    it("Adds tag if missing", () => {
        const tags = ["tag1", "tag2", "tag3"];
        expect(CanvasHelpers.addIfMissing(tags, "tag2")).toEqual(["tag1", "tag2", "tag3"]);
        expect(CanvasHelpers.addIfMissing(tags, "tag4")).toEqual(["tag1", "tag2", "tag3", "tag4"]);
    });

    it("Adds all tags if missing", () => {
        const tags = ["tag1", "tag2", "tag3"];
        const targets = ["tag3", "tag4", "tag5"];
        expect(CanvasHelpers.addAllIfMissing(tags, targets)).toEqual(["tag1", "tag2", "tag3", "tag4", "tag5"]);
    });

    it("Removes tag if contained", () => {
        const tags = ["tag1", "tag2", "tag3"];
        expect(CanvasHelpers.removeIfContained(tags, "tag4")).toEqual(["tag1", "tag2", "tag3"]);
        expect(CanvasHelpers.removeIfContained(tags, "tag1")).toEqual(["tag2", "tag3"]);
    });

    it("Updates regions", () => {
        const originals = MockFactory.createTestRegions();
        const updatedRegion = {
            ...originals[0],
            tags: ["tag1"],
        };

        const updated = CanvasHelpers.updateRegions(originals, [updatedRegion]);
        expect(updated[0]).toEqual({
            ...originals[0],
            tags: ["tag1"],
        });

        expect(CanvasHelpers.updateRegions(originals, [])).toEqual(originals);
    });
});
