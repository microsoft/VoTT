import { ExportAssetState } from "../providers/export/exportProvider";
import { IPoint } from "./applicationState";
/**
 * @name - V1 Project
 * @description - Defines the structure of a version 1 Project
 * @member frames - Dictionary of all frame objects in the project (filename: list of regions in that file)
 * @member framerate - Rate at which a video is stepped through
 * @member inputTags - Comma delimited list of all tags in the project
 * @member suggestiontype - Setting to suggest regions for the next frame
 * @member scd - Boolean to describe whether scene-change detection is enabled
 * @member visitedFrames - List of frames in the project that have been visited--string for image, number for video
 * @member tag_colors - List of all tag colors corresponding to the tags in "tags"
 */
export interface IV1Project {
    frames: {[frameName: string]: IV1Region[]};
    framerate: string;
    inputTags: string;
    suggestiontype: string;
    scd: boolean;
    visitedFrames: string[] | number[];
    tag_colors: string[];
}

/**
 * @name - V1 Region Object
 * @description - Defines the structure of a version 1 Region
 * @member x1 - Left-most x-value of the region
 * @member y1 - Top-most y-value of the region
 * @member x2 - Right-most x-value of the region
 * @member y2 - Bottom-most y-value of the region
 * @member width - Width of the frame that the region is in
 * @member height - Height of the frame that the region is in
 * @member box - Object holding x1, y1, x2, y2
 * @member points - List of IPoints describing the 4 corners of the region
 * @member UID - Unique, auto-generated ID
 * @member id - Index of the region in the list of all regions in project
 * @member type - shape of the region, "rect" is the only option in V1
 * @member tags - List of strings that are the tags associated with the region
 * @member name - Index of the region in the frame (starts at 1)
 */
export interface IV1Region {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
    box: { [point: string]: number };
    points: IPoint[];
    UID: string;
    id: number;
    type: string;
    tags: string[];
    name: number;
}
