import * as shortid from "shortid";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import { IBoundingBox, IPoint, IRegion, ITag, RegionType } from "../../../../models/applicationState";

/**
 * Margin to leave between pasted element and previously pasted element or edge of screen
 */
const pasteMargin = 10;
/**
 * Static functions to assist in operations within Canvas component
 */
export default class CanvasHelpers {

    /**
     * Adds tag to array if it does not contain the tag,
     * removes tag if already contained. Performs operations in place
     * @param tags Array of tags
     * @param tag Tag to toggle
     */
    public static toggleTag(tags: ITag[], tag: ITag): ITag[] {
        const tagIndex = tags.findIndex((existingTag) => existingTag.name === tag.name);
        if (tagIndex === -1) {
            // Tag isn't found within region tags, add it
            tags.push(tag);
        } else {
            // Tag is within region tags, remove it
            tags.splice(tagIndex, 1);
        }
        return tags;
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
     * Create TagsDescriptor (CanvasTools) from IRegion
     * @param region IRegion from Canvas
     */
    public static getTagsDescriptor(region: IRegion): TagsDescriptor {
        return new TagsDescriptor(region.tags.map((tag) => new Tag(tag.name, tag.color)));
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

    public static duplicateAndTransformRegion = (region: IRegion, otherRegions: IRegion[]): IRegion => {
        return CanvasHelpers.transformRegion(
            CanvasHelpers.duplicateRegion(region),
            otherRegions
        );
    }
    
    public static duplicateRegion = (region: IRegion): IRegion => {
        return {
            ...region,
            id: shortid.generate()
        };
    }

    private static getTransformDiff = (region: IRegion, otherRegions: IRegion[]): IPoint => {
        let targetX = 0 + pasteMargin;
        let targetY = 0 + pasteMargin;

        let foundRegionAtTarget = false;

        while (!foundRegionAtTarget) {
            for(const region of otherRegions) {
                if (region.boundingBox.left === targetX && region.boundingBox.top === targetY) {
                    foundRegionAtTarget = true;
                    break;
                }
            }
            if (foundRegionAtTarget) {
                targetX += pasteMargin;
                targetY += pasteMargin;
                foundRegionAtTarget = false;
            } else {
                return {
                    x: region.boundingBox.left - targetX,
                    y: region.boundingBox.top - targetY
                }
            }
        }        
    }

    private static transformPoints = (points: IPoint[], transformDiff: IPoint): IPoint[] => {
        return points.map((point) => {
            return {
                x: point.x - transformDiff.x,
                y: point.y - transformDiff.y
            }
        });
    }

    private static transformBoundingBox = (boundingBox: IBoundingBox, transformDiff: IPoint): IBoundingBox => {
        return {
            ...boundingBox,
            left: boundingBox.left - transformDiff.x,
            top: boundingBox.top - transformDiff.y
        }
    }

    private static transformRegion = (region: IRegion, otherRegions: IRegion[]): IRegion => {
        const tranformDiff = CanvasHelpers.getTransformDiff(region, otherRegions);
        return {
            ...region,
            points: CanvasHelpers.transformPoints(region.points, tranformDiff),
            boundingBox: CanvasHelpers.transformBoundingBox(region.boundingBox, tranformDiff)
        }
    }
}