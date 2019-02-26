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
     * @param regions Existing regions array
     * @param region Region to be toggled
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
     * Adds tag to tags if not contained
     * @param tags Existing tags array
     * @param tag Tag to be added if missing
     */
    public static addIfMissing(tags: string[], tag: string): void {
        if (tags.find((t) => t === tag)) {
            tags.push(tag);
        }
    }

    /**
     * Adds all target tags if missing from tags
     * @param tags Existing tags array
     * @param newTags Tags to be added if not contained
     */
    public static addAllIfMissing(tags: string[], newTags: string[]): void {
        for (const target of newTags) {
            CanvasHelpers.addIfMissing(tags, target);
        }
    }

    /**
     * Removes tag from tags if contained
     * @param tags Existing tags array
     * @param tag Tag to be removed if contained in `tags`
     */
    public static removeIfContained(tags: string[], tag: string): void {
        const index = tags.findIndex((t) => t === tag)
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
        if (!regions || !updates || !updates.length) {
            return regions;
        }
        const result: IRegion[] = [];
        for (const region of regions) {
            const update = updates.find((r) => r.id === region.id);
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
