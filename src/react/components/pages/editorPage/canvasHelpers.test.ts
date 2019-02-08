import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import MockFactory from "../../../../common/mockFactory";
import { IRegion, RegionType, IBoundingBox, IPoint } from "../../../../models/applicationState";
import CanvasHelpers from "./canvasHelpers";
import * as shortid from "shortid";

describe("Canvas Helpers", () => {
    it("Adds a tag to list", () => {
        const tags = MockFactory.createTestTags();
        const originalLength = tags.length;
        const newTag = MockFactory.createTestTag("New Tag");
        CanvasHelpers.toggleTag(
            tags,
            newTag,
        );
        expect(tags).toHaveLength(originalLength + 1);
        expect(tags[tags.length - 1]).toEqual(newTag);
    });

    it("Removes a tag from list", () => {
        const tags = MockFactory.createTestTags();
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

    it("Duplicates region with new id", () => {
        const initialId = shortid.generate();
        const region = MockFactory.createTestRegion(initialId);
        const duplicate = CanvasHelpers.duplicateRegion(region);
        expect(duplicate).toMatchObject({
            ...region,
            id: expect.any(String),
        });
        expect(duplicate.id).not.toEqual(initialId);
    });

    it("Duplicates and transforms region correctly", () => {
        const initialRegion = MockFactory.createRandomRectangleRegion();
        const otherRegions = [];
        for (let i = 0; i < 5; i++) {
            otherRegions.push(MockFactory.createRandomRectangleRegion());
        }

        const regionsToDuplicateAndTransform = 5;

        for(let i = 0; i < regionsToDuplicateAndTransform; i++) {
            const duplicatedAndTransformed = CanvasHelpers.duplicateAndTransformRegion(initialRegion, otherRegions);

            expect(duplicatedAndTransformed.id).not.toEqual(initialRegion.id);
    
            const x1 = CanvasHelpers.pasteMargin * (i + 1);
            const y1 = CanvasHelpers.pasteMargin * (i + 1);
    
            const height = initialRegion.boundingBox.height;
            const width = initialRegion.boundingBox.width;
    
            expect(duplicatedAndTransformed.boundingBox).toEqual({
                left: x1,
                top: y1,
                height,           
                width,
            });
    
            const x2 = x1 + width;
            const y2 = y1 + height;
    
            expect(duplicatedAndTransformed.points).toEqual([
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
                }
            ]);
            otherRegions.push(duplicatedAndTransformed);
        }       
    });
});
