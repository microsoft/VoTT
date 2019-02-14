import * as shortid from "shortid";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import { IBoundingBox, IPoint, IRegion, ITag,
    RegionType, EditorMode, IAssetMetadata } from "../../../../models/applicationState";

/**
 * Static functions to assist in operations within Canvas component
 */
export default class CanvasHelpers {

    /**
     * Margin to leave between pasted element and previously pasted element or edge of screen
     */
    public static pasteMargin = 10;

    /**
     * Adds tag to array if it does not contain the tag,
     * removes tag if already contained.
     * @param tags Array of tags
     * @param tag Tag to toggle
     */
    public static toggleTag(tags: ITag[], tag: ITag): ITag[] {
        if (!tag) {
            return tags;
        }
        if (!tags) {
            return [ tag ];
        }
        if (CanvasHelpers.getTag(tags, tag.name)) {
            return tags.filter((t) => t.name !== tag.name);
        } else {
            return [...tags, tag];
        }
    }

    public static toggleAllTags(tags: ITag[], toggle: ITag[]) {
        let newTags = [...tags];
        for (const tag of toggle) {
            newTags = CanvasHelpers.toggleTag(newTags, tag);
        }
        return newTags;
    }

    public static addAllIfMissing(tags: ITag[], newTags: ITag[]) {
        const result = [...tags];
        for (const tag of newTags) {
            if (!CanvasHelpers.getTag(result, tag.name)) {
                result.push(tag);
            }
        }
        return result;
    }

    public static addIfMissing(tags: ITag[], tag: ITag): ITag[] {
        if (!tag) {
            return tags;
        }
        if (!tags) {
            return [ tag ];
        }
        if (!CanvasHelpers.getTag(tags, tag.name)) {
            return [...tags, tag];
        } else {
            return tags;
        }
    }

    public static removeIfContained(tags: ITag[], tag: ITag): ITag[] {
        if (!tags || !tag) {
            return tags;
        }
        if (CanvasHelpers.getTag(tags, tag.name)) {
            return tags.filter((t) => t.name !== tag.name);
        } else {
            return tags;
        }
    }

    public static getTag(tags: ITag[], name: string): ITag {
        return tags.find((t) => t.name === name);
    }

    public static getRegion(regions: IRegion[], id: string): IRegion {
        return regions.find((r) => r.id === id);
    }

    /**
     * @param regions Regions with tags to transform
     * @param lockedTags Tags currently locked within the editor page
     * @param selectedTag Tag most recently selected. Not included if called from region selection
     * @returns Copy of regions with appropriate tag operations applied. Expected behavior:
     * If called by region selection, add all missing tags
     * If lockedTags is empty, toggle selected tag on region tags
     * If selectedTag is within lockedTags, add selectedTag to region tags
     * If selectedTag is not within lockedTags, remove selectedTag from region tags
     */
    public static applyTagsToRegions = (regions: IRegion[], lockedTags: ITag[], selectedTag?: ITag): IRegion[] => {

        const lockedTagsEmpty = !lockedTags || !lockedTags.length;
        if (!selectedTag && lockedTagsEmpty) {
            return regions;
        }
        let transformer: (tags: ITag[], target: ITag|ITag[]) => ITag[];
        let target: ITag|ITag[] = selectedTag;
        if (!selectedTag && !lockedTagsEmpty) {
            // Region selection while exist locked tags
            transformer = CanvasHelpers.addAllIfMissing;
            target = lockedTags;
        } else if (lockedTagsEmpty) {
            // Tag selected while region(s) selected
            transformer = CanvasHelpers.toggleTag;
        } else if (CanvasHelpers.getTag(lockedTags, selectedTag.name)) {
            // Tag added to locked tags while region(s) selected
            transformer = CanvasHelpers.addIfMissing;
        } else {
            // Tag removed from locked tags while region(s) selected
            transformer = CanvasHelpers.removeIfContained;
        }
        return CanvasHelpers.transformRegionTags(regions, target, transformer);
    }

    /**
     * Get RegionData (CanvasTools) from IRegion
     * @param region IRegion from Canvas component
     */
    public static getRegionDataFromRegion(region: IRegion): RegionData {
        return new RegionData(region.boundingBox.left,
            region.boundingBox.top,
            region.boundingBox.width,
            region.boundingBox.height,
            region.points.map((point) =>
                new Point2D(point.x, point.y)),
            this.regionTypeToType(region.type));
    }

    public static getRegionFromRegionData(regionData: RegionData, editorMode: EditorMode, id?: string): IRegion {
        return {
            id: (id) ? id : shortid.generate(),
            type: this.editorModeToType(editorMode),
            tags: [],
            boundingBox: {
                height: regionData.height,
                width: regionData.width,
                left: regionData.x,
                top: regionData.y,
            },
            points: regionData.points,
        };
    }

    public static updateRegions(regions: IRegion[], updates: IRegion[]): IRegion[]{
        let result: IRegion[]
        for (const update of updates) {
            result = regions.map((r) => (r.id === update.id) ? update : r);
        }
        return result;
    }

    public static cloneAndUpdateRegions(asset: IAssetMetadata, updates: IRegion[]): IAssetMetadata {
        return {
            ...asset,
            regions: CanvasHelpers.updateRegions(asset.regions, updates)
        };
    }

    public static editorModeToType(editorMode: EditorMode) {
        let type;
        switch (editorMode) {
            case EditorMode.Rectangle:
                type = RegionType.Rectangle;
                break;
            case EditorMode.Polygon:
                type = RegionType.Polygon;
                break;
            case EditorMode.Point:
                type = RegionType.Point;
                break;
            case EditorMode.Polyline:
                type = RegionType.Polyline;
                break;
            default:
                break;
        }
        return type;
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

    /**
     * Duplicates array of regions and transforms them +10 on both x and y coordinates
     */
    public static duplicateAndTransformRegions = (regions: IRegion[], otherRegions: IRegion[]): IRegion[] => {
        return CanvasHelpers.transformRegions(
            CanvasHelpers.duplicateRegions(regions),
            otherRegions,
        );
    }

    /**
     * Duplicate array of regions, with new IDs
     */
    public static duplicateRegions = (regions: IRegion[]): IRegion[] => {
        return regions.map((region) => {
            return {
                ...region,
                id: shortid.generate(),
            };
        });
    }

    private static transformRegionTags(
        regions: IRegion[], target: ITag|ITag[], transformer: (tags: ITag[], target: ITag|ITag[]) => ITag[]) {
        return regions.map((r) => {
            return {
                ...r,
                tags: transformer(r.tags, target),
            };
        });
    }

    private static getTransformDiff = (region: IRegion, otherRegions: IRegion[]): IPoint => {
        let targetX = region.boundingBox.left;
        let targetY = region.boundingBox.top;

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
                    x: region.boundingBox.left - targetX,
                    y: region.boundingBox.top - targetY,
                };
            }
        }
    }

    private static transformPoints = (points: IPoint[], transformDiff: IPoint): IPoint[] => {
        return points.map((point) => {
            return {
                x: point.x - transformDiff.x,
                y: point.y - transformDiff.y,
            };
        });
    }

    private static transformBoundingBox = (boundingBox: IBoundingBox, transformDiff: IPoint): IBoundingBox => {
        return {
            ...boundingBox,
            left: boundingBox.left - transformDiff.x,
            top: boundingBox.top - transformDiff.y,
        };
    }

    private static transformRegions = (regions: IRegion[], otherRegions: IRegion[]): IRegion[] => {
        return regions.map((region) => {
            const tranformDiff = CanvasHelpers.getTransformDiff(region, otherRegions.concat(regions));
            return {
                ...region,
                points: CanvasHelpers.transformPoints(region.points, tranformDiff),
                boundingBox: CanvasHelpers.transformBoundingBox(region.boundingBox, tranformDiff),
            };
        });
    }
}
