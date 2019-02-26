import shortid from "shortid";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import Guard from "../../../../common/guard";
import { IBoundingBox, IRegion, ITag, RegionType, IPoint } from "../../../../models/applicationState";

/**
 * Static functions to assist in operations within Canvas component
 */
export default class CanvasHelpers {

    public static pasteMargin = 10;

    /**
     * Adds tag to array if it does not contain the tag,
     * removes tag if already contained. Performs operations in place
     * @param tags Array of tags
     * @param tag Tag to toggle
     */
    public static toggleTag(tags: string[], tag: string): void {
        const tagIndex = tags.findIndex((existingTag) => existingTag === tag);
        if (tagIndex === -1) {
            // Tag isn't found within region tags, add it
            tags.push(tag);
        } else {
            // Tag is within region tags, remove it
            tags.splice(tagIndex, 1);
        }
    }

    /**
     * Get RegionData (CanvasTools) from IRegion
     * @param region IRegion from Canvas component
     */
    public static getRegionData(region: IRegion): RegionData {
        return new RegionData(region.boundingBox.left,
            region.boundingBox.top,
            region.boundingBox.width,
            region.boundingBox.height,
            region.points.map((point) =>
                new Point2D(point.x, point.y)),
            this.regionTypeToType(region.type));
    }

    /**
     * Converts a canvas tools RegionData to VoTT IRegion
     * @param regionData The region data to convert
     * @param regionType The region type
     */
    public static fromRegionData(regionData: RegionData, regionType: RegionType): IRegion {
        Guard.null(regionData);

        return {
            id: shortid.generate(),
            type: regionType,
            boundingBox: {
                left: regionData.x,
                top: regionData.y,
                width: regionData.width,
                height: regionData.height,
            },
            points: regionData.points.map((point) => new Point2D(point.x, point.y)),
            tags: [],
        };
    }

    /**
     * Create TagsDescriptor (CanvasTools) from IRegion
     * @param region IRegion from Canvas
     */
    public static getTagsDescriptor(projectTags: ITag[], region: IRegion): TagsDescriptor {
        Guard.null(projectTags);
        Guard.null(region);

        const tags = region.tags
            .map((tagName) => {
                const projectTag = projectTags.find((projectTag) => projectTag.name === tagName);
                return projectTag ? new Tag(projectTag.name, projectTag.color) : null;
            })
            .filter((tag) => tag !== null);

        return new TagsDescriptor(tags);
    }

    /**
     * Gets RegionDataType (CanvasTools) from RegionType
     */
    public static regionTypeToType = (regionType: RegionType) => {
        let type;
        switch (regionType) {
            case RegionType.Rectangle:
                type = RegionDataType.Rect;
                break;
            case RegionType.Polygon:
                type = RegionDataType.Polygon;
                break;
            case RegionType.Point:
                type = RegionDataType.Point;
                break;
            case RegionType.Polyline:
                type = RegionDataType.Polyline;
                break;
            default:
                break;
        }
        return type;
    }

    public static duplicateRegionsAndMove = (regions: IRegion[], others: IRegion[]): IRegion[] => {
        const result: IRegion[] = [];
        for (const region of regions) {
            const shiftCoordinates = CanvasHelpers.getShiftCoordinates(region.boundingBox, others);

            const newRegion: IRegion = {
                ...region,
                id: shortid.generate(),
                boundingBox: CanvasHelpers.shiftBoundingBox(region.boundingBox, shiftCoordinates),
                points: CanvasHelpers.shiftPoints(region.points, shiftCoordinates),
            };
            result.push(newRegion);
        }
        return result;
    }

    private static shiftBoundingBox = (boundingBox: IBoundingBox, shiftCoordinates: IPoint): IBoundingBox => {
        return {
            ...boundingBox,
            left: boundingBox.left + shiftCoordinates.x,
            top: boundingBox.top + shiftCoordinates.y,
        };
    }

    private static shiftPoints = (points: IPoint[], shiftCoordinates: IPoint) => {
        return points.map((p) => {
            return {
                x: p.x + shiftCoordinates.x,
                y: p.y + shiftCoordinates.y,
            };
        });
    }

    private static getShiftCoordinates = (boundingBox: IBoundingBox, otherRegions: IRegion[]) => {
        let x = boundingBox.left;
        let y = boundingBox.top;

        let foundRegionAtTarget = false;

        while (!foundRegionAtTarget) {
            for (const region of otherRegions) {
                if (region.boundingBox.left === x && region.boundingBox.top === y) {
                    foundRegionAtTarget = true;
                    break;
                }
            }
            if (foundRegionAtTarget) {
                x += CanvasHelpers.pasteMargin;
                y += CanvasHelpers.pasteMargin;
                foundRegionAtTarget = false;
            } else {
                return {
                    x: x - boundingBox.left,
                    y: y - boundingBox.top,
                };
            }
        }
    }
}
