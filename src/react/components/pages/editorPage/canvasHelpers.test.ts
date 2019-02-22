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

    it("Toggles a tag", () => {
        const tags = ["tag1", "tag2", "tag3"];
        CanvasHelpers.toggleTag(tags, "tag1");
        expect(tags).toEqual(["tag2", "tag3"]);
    });

    it("Toggles a region", () => {
        const regions = [
            MockFactory.createTestRegion("region1"),
            MockFactory.createTestRegion("region2"),
            MockFactory.createTestRegion("region3"),
        ];
        CanvasHelpers.toggleRegion(regions, regions[0]);
        expect(regions).toEqual([
            MockFactory.createTestRegion("region2"),
            MockFactory.createTestRegion("region3"),
        ]);
        CanvasHelpers.toggleRegion(regions, MockFactory.createTestRegion("region4"));
        expect(regions).toEqual([
            MockFactory.createTestRegion("region2"),
            MockFactory.createTestRegion("region3"),
            MockFactory.createTestRegion("region4"),
        ]);

    });

    it("Finds a region", () => {
        const regions = [
            MockFactory.createTestRegion("region1"),
            MockFactory.createTestRegion("region2"),
            MockFactory.createTestRegion("region3"),
        ];
        const found = CanvasHelpers.findRegion(regions, "region1");
        expect(found).toEqual(MockFactory.createTestRegion("region1"));
        const notFound = CanvasHelpers.findRegion(regions, "region4");
        expect(notFound).toBeUndefined();
    });

    it("Finds index of tag", () => {
        const tags = ["tag1", "tag2", "tag3"];
        expect(CanvasHelpers.findIndex(tags, "tag1")).toBe(0);
    });

    it("Adds tag if missing", () => {
        const tags = ["tag1", "tag2", "tag3"];
        CanvasHelpers.addIfMissing(tags, "tag2");
        expect(tags).toEqual(["tag1", "tag2", "tag3"]);
        CanvasHelpers.addIfMissing(tags, "tag4");
        expect(tags).toEqual(["tag1", "tag2", "tag3", "tag4"]);
    });

    it("Adds all tags if missing", () => {
        const tags = ["tag1", "tag2", "tag3"];
        const targets = ["tag3", "tag4", "tag5"];
        CanvasHelpers.addAllIfMissing(tags, targets);
        expect(tags).toEqual(["tag1", "tag2", "tag3", "tag4", "tag5"]);
    });

    it("Removes tag if contained", () => {
        const tags = ["tag1", "tag2", "tag3"];
        CanvasHelpers.removeIfContained(tags, "tag4");
        expect(tags).toEqual(["tag1", "tag2", "tag3"]);
        CanvasHelpers.removeIfContained(tags, "tag1");
        expect(tags).toEqual(["tag2", "tag3"]);
    });

    it("Updates regions", () => {
        const originals = MockFactory.createTestRegions();
        const updates = [{
            ...MockFactory.createTestRegion(originals[0].id),
            tags: ["tag1"],
        }];
        const updated = CanvasHelpers.updateRegions(originals, updates);
        expect(updated[0]).toEqual({
            ...MockFactory.createTestRegion(originals[0].id),
            tags: ["tag1"],
        });
    });
});
