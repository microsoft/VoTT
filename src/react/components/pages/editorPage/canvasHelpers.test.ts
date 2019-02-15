import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import MockFactory from "../../../../common/mockFactory";
import { IRegion, RegionType, IBoundingBox, IPoint } from "../../../../models/applicationState";
import CanvasHelpers from "./canvasHelpers";
import * as shortid from "shortid";

describe("Canvas Helpers", () => {
    it("Adds a tag to list", () => {
        const tags = MockFactory.createTestTags().map((tag) => tag.name);
        const originalLength = tags.length;
        const newTag = "New Tag"

        const newTags = CanvasHelpers.toggleTag(
            tags,
            newTag,
        );
        expect(newTags).toHaveLength(originalLength + 1);
        expect(newTags[newTags.length - 1]).toEqual(newTag);
    });

    it("Removes a tag from list", () => {
        const tags = MockFactory.createTestTags().map((tag) => tag.name);
        const originalLength = tags.length;
        const originalFirstTag = tags[0];
        const newTags = CanvasHelpers.toggleTag(
            tags,
            tags[0],
        );
        expect(newTags).toHaveLength(originalLength - 1);
        expect(newTags[0]).not.toEqual(originalFirstTag);
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
        expect(CanvasHelpers.getRegionDataFromRegion(region)).toEqual(expected);
    });

    it("Gets correct region data type", () => {
        expect(CanvasHelpers.regionTypeToType(RegionType.Rectangle)).toEqual(RegionDataType.Rect);
        expect(CanvasHelpers.regionTypeToType(RegionType.Polygon)).toEqual(RegionDataType.Polygon);
        expect(CanvasHelpers.regionTypeToType(RegionType.Point)).toEqual(RegionDataType.Point);
        expect(CanvasHelpers.regionTypeToType(RegionType.Polyline)).toEqual(RegionDataType.Polyline);
        expect(CanvasHelpers.regionTypeToType(null)).toBeUndefined();
    });

    it("Duplicates region with new id", () => {
        const regions = MockFactory.createTestRegions();
        const duplicates = CanvasHelpers.duplicateRegions(regions);
        expect(duplicates).toHaveLength(regions.length);
        for (let i = 0; i < regions.length; i++) {
            const duplicate = duplicates[i];
            const region = regions[i];
            expect(duplicate).toMatchObject({
                ...region,
                id: expect.any(String),
            });
            expect(duplicate.id).not.toEqual(region.id);
        }
    });

    it("Duplicates and transforms regions correctly one time", () => {
        const regions = MockFactory.createTestRegions();
        const others = MockFactory.createTestRegions();

        const duplicates = CanvasHelpers.duplicateAndTransformRegions(regions, others);

        expect(duplicates).toHaveLength(regions.length);

        const m = CanvasHelpers.pasteMargin;

        for (let i = 0; i < regions.length; i++) {
            const duplicate = duplicates[i];
            const region = regions[i];

            const x1 = region.boundingBox.left + m;
            const y1 = region.boundingBox.top + m;

            const width = region.boundingBox.width;
            const height = region.boundingBox.height;

            expect(duplicate.boundingBox).toEqual({
                ...region.boundingBox,
                left: x1,
                top: y1,
            });

            const x2 = x1 + width;
            const y2 = y1 + height;

            expect(duplicate.points).toEqual([
                {
                    x: x1,
                    y: y1,
                },
                {
                    x: x2,
                    y: y1,
                },
                {
                    x: x1,
                    y: y2,
                },
                {
                    x: x2,
                    y: y2,
                },
            ]);
        }
    });

    it("Duplicates and transforms regions correctly multiple times", () => {
        const regions = MockFactory.createTestRegions();
        let others = MockFactory.createTestRegions();

        const numberOfDuplications = 5;

        for (let i = 0; i < numberOfDuplications; i++) {

            const duplicates = CanvasHelpers.duplicateAndTransformRegions(regions, others);
            expect(duplicates).toHaveLength(regions.length);

            const m = CanvasHelpers.pasteMargin * (i + 1);

            for (let j = 0; j < regions.length; j++) {
                const duplicate = duplicates[j];
                const region = regions[j];

                const x1 = region.boundingBox.left + m;
                const y1 = region.boundingBox.top + m;

                const width = region.boundingBox.width;
                const height = region.boundingBox.height;

                expect(duplicate.boundingBox).toEqual({
                    ...region.boundingBox,
                    left: x1,
                    top: y1,
                });

                const x2 = x1 + width;
                const y2 = y1 + height;

                expect(duplicate.points).toEqual([
                    {
                        x: x1,
                        y: y1,
                    },
                    {
                        x: x2,
                        y: y1,
                    },
                    {
                        x: x1,
                        y: y2,
                    },
                    {
                        x: x2,
                        y: y2,
                    },
                ]);
            }
            others = others.concat(duplicates);
        }
    });

    it("Updates regions correctly", () => {
        const regions = MockFactory.createTestRegions();
        const tags = ["My tag"];
        const replacementRegion: IRegion = {
            ...regions[0],
            tags,
        };
        const updated = CanvasHelpers.updateRegions(regions, [replacementRegion]);
        expect(updated[0]).toEqual(replacementRegion);
        expect(regions[0]).not.toEqual(replacementRegion);
        expect(updated).toHaveLength(regions.length);
        for (let i = 1; i < regions.length; i++) {
            expect(regions[i]).toEqual(updated[i]);
        }
    });

    function getRegionTags(regions: IRegion[]) {
        return regions.map((r) => r.tags);
    }

    describe("Applies tags to regions appropriately", () => {
        const regions = MockFactory.createTestRegions(5);

        const tag1 = "tag1";
        const tag2 = "tag2";
        const tag3 = "tag3";

        const originalTags = [
            [tag1, tag2],
            [tag2],
            [tag2, tag3],
            [tag1, tag2, tag3],
            [],
        ];

        for (let i = 0; i < 5; i++) {
            regions[i].tags = originalTags[i];
        }

        it("No selected tag, add all locked tags", () => {
            const transformedTags = getRegionTags(CanvasHelpers.applyTagsToRegions(regions, [ tag1, tag3 ]));
            const expectedTags = [
                [tag1, tag2, tag3],
                [tag2, tag1, tag3],
                [tag2, tag3, tag1],
                [tag1, tag2, tag3],
                [tag1, tag3],
            ];

            expect(transformedTags).toEqual(expectedTags);
            // Make sure regions is not modified
            const regionTags = regions.map((r) => r.tags);
            expect(regions.map((r) => r.tags)).toEqual(originalTags);
        });

        it("Selected tag within locked tags, add to region if missing", () => {
            expect(getRegionTags(CanvasHelpers.applyTagsToRegions(regions, [ tag1, tag3 ], tag1))).toEqual([
                [tag1, tag2],
                [tag2, tag1],
                [tag2, tag3, tag1],
                [tag1, tag2, tag3],
                [tag1],
            ]);
        });

        it("Selected tag not within locked tags, remove from region if contained", () => {
            expect(getRegionTags(CanvasHelpers.applyTagsToRegions(regions, [ tag3 ], tag1))).toEqual([
                [tag2],
                [tag2],
                [tag2, tag3],
                [tag2, tag3],
                [],
            ]);
        });

        it("Locked tags empty, toggle selected tag", () => {
            expect(getRegionTags(CanvasHelpers.applyTagsToRegions(regions, [], tag1))).toEqual([
                [tag2],
                [tag2, tag1],
                [tag2, tag3, tag1],
                [tag2, tag3],
                [tag1],
            ]);
        });

    });
});
