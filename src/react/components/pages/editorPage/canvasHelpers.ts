import { ITag, IRegion, RegionType } from "../../../../models/applicationState";
import { Point2D } from "vott-ct/lib/js/CanvasTools/Core/Point2D";
import { RegionData, RegionDataType } from "vott-ct/lib/js/CanvasTools/Core/RegionData";
import { TagsDescriptor } from "vott-ct/lib/js/CanvasTools/Core/TagsDescriptor";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";

export default class CanvasHelpers {

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

    public static getRegionData(region: IRegion): RegionData {
        return new RegionData(region.boundingBox.left,
            region.boundingBox.top,
            region.boundingBox.width,
            region.boundingBox.height,
            region.points.map((point) =>
                new Point2D(point.x, point.y)),
            this.regionTypeToType(region.type));
    }

    public static getTagsDescriptor(region: IRegion): TagsDescriptor {
        return new TagsDescriptor(region.tags.map((tag) => new Tag(tag.name, tag.color)));
    }

    private static regionTypeToType = (regionType: RegionType) => {
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
