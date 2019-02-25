import { ITag, IRegion, RegionType, IBoundingBox } from "../../../../models/applicationState";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";
import Guard from "../../../../common/guard";
import shortid from "shortid";

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

    public static getNewBoundingBox = (boundingBox: IBoundingBox, otherRegions: IRegion[]): IBoundingBox => {
        let targetX = boundingBox.left;
        let targetY = boundingBox.top;

        let foundRegionAtTarget = false;

        while (!foundRegionAtTarget) {
            for (const region of otherRegions) {
                if (region.boundingBox.left === targetX && region.boundingBox.top === targetY) {
                    foundRegionAtTarget = true;
                    break;
                }
            }
            if (foundRegionAtTarget) {
                targetX += CanvasHelpers.pasteMargin;
                targetY += CanvasHelpers.pasteMargin;
                foundRegionAtTarget = false;
            } else {
                return {
                    ...boundingBox,
                    left: boundingBox.left + targetX,
                    top: boundingBox.top + targetY,
                };
            }
        }
    }

    public static duplicateRegionsAndMove = (regions: IRegion[], others: IRegion[]): IRegion[] => {
        const result: IRegion[] = [];
        for (const region of regions) {
            const dup = CanvasHelpers.duplicateRegionAndMove(region, others.concat(result));
            result.push(dup);
        }
        return result;
    }

    public static duplicateRegionAndMove = (region: IRegion, others: IRegion[]): IRegion => {
        const targetX = region.boundingBox.left;
        const targetY = region.boundingBox.top;

        let foundRegionAtTarget = false;

        while (!foundRegionAtTarget) {
            if (region.boundingBox.left === targetX && region.boundingBox.top === targetY) {
                foundRegionAtTarget = true;
                break;
            }
        }
        return {
            ...region,
            id: shortid.generate(),
            boundingBox: CanvasHelpers.getNewBoundingBox(region.boundingBox, others),
        };
    }
}
