import { ITag, IRegion, RegionType } from "../../../../models/applicationState";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";
import Guard from "../../../../common/guard";

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
     * Adds region to regions if missing,
     * Removes region from regions if contained
     */
    public static toggleRegion(regions: IRegion[], region: IRegion): void {
        const index = regions.findIndex((r) => r.id === region.id);
        if (index === -1) {
            regions.push(region);
        } else {
            regions.splice(index, 1);
        }
    }

    /**
     * Finds a string in array of strings
     */
    public static find(items: string[], item: string): string {
        return items.find((t) => t === item);
    }

    /**
     * Finds region with id if contained in array of regions
     */
    public static findRegion(regions: IRegion[], id: string): IRegion {
        return regions.find((r) => (r.id === id));
    }

    /**
     * Find index of string in array of strings
     */
    public static findIndex(tags: string[], tag: string): number {
        return tags.findIndex((t) => t === tag);
    }

    /**
     * Adds tag to tags if not contained
     */
    public static addIfMissing(tags: string[], tag: string): void {
        if (!CanvasHelpers.find(tags, tag)) {
            tags.push(tag);
        }
    }

    /**
     * Adds all target tags if missing from tags
     */
    public static addAllIfMissing(tags: string[], targets: string[]): void {
        for (const target of targets) {
            CanvasHelpers.addIfMissing(tags, target);
        }
    }

    /**
     * Removes tag from tags if contained
     */
    public static removeIfContained(tags: string[], tag: string): void {
        const index = CanvasHelpers.findIndex(tags, tag);
        if (index >= 0) {
            tags.splice(index, 1);
        }
    }

    /**
     * Updates any IRegion in `regions` that has the same id as IRegion in `updates`
     * @param regions Original regions
     * @param updates Regions that are to be updated in `regions`
     */
    public static updateRegions(regions: IRegion[], updates: IRegion[]): IRegion[] {
        if (!regions || !updates) {
            return regions;
        }
        const result: IRegion[] = [];
        for (const region of regions) {
            const update = CanvasHelpers.findRegion(updates, region.id);
            if (update) {
                result.push(update);
            } else {
                result.push(region);
            }
        }
        return result;
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
}
