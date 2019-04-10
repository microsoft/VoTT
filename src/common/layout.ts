import { ContentSource } from "../react/components/common/assetPreview/assetPreview";
import { IBoundingBox, ISize } from "../models/applicationState";
import Guard from "./guard";

/**
 * Gets the current position of the specified content source
 * @param contentSource The HTML element to get position
 */
export function createContentBoundingBox(contentSource: ContentSource): IBoundingBox {
    Guard.null(contentSource);

    let aspectRatio: number = null;
    if (contentSource instanceof HTMLVideoElement) {
        aspectRatio = contentSource.videoWidth / contentSource.videoHeight;
    } else if (contentSource instanceof HTMLImageElement) {
        aspectRatio = contentSource.naturalWidth / contentSource.naturalHeight;
    } else {
        aspectRatio = contentSource.width / contentSource.height;
    }

    let size: ISize = null;

    // Landscape = aspectRatio > 1
    // Portrait  = aspectRatio < 1
    if (aspectRatio >= 1) {
        size = {
            width: contentSource.offsetWidth,
            height: contentSource.offsetWidth / aspectRatio,
        };

        // Render as landscape except for when the calculated height
        // would be taller than the available area
        return size.height > contentSource.offsetHeight
            ? createPortraitBoundingBox(contentSource, aspectRatio)
            : createLandscapeBoundingBox(contentSource, aspectRatio);
    } else {
        size = {
            width: contentSource.offsetHeight * aspectRatio,
            height: contentSource.offsetHeight,
        };

        // Render as portrait except for when the calculated width
        // would be wider then the available area
        return size.width > contentSource.offsetWidth
            ? createLandscapeBoundingBox(contentSource, aspectRatio)
            : createPortraitBoundingBox(contentSource, aspectRatio);
    }
}

/**
 * Gets a landscape bounding box for the canvas element based on the content source and aspect ratio
 * Disregards generated bars from the browser
 * @param contentSource The HTML content element
 * @param aspectRatio The requested aspect ratio
 */
export function createLandscapeBoundingBox(contentSource: ContentSource, aspectRatio: number): IBoundingBox {
    Guard.null(contentSource);

    const size = {
        width: contentSource.offsetWidth,
        height: contentSource.offsetWidth / aspectRatio,
    };

    return {
        width: size.width,
        height: size.height,
        left: contentSource.offsetLeft,
        top: contentSource.offsetTop + ((contentSource.offsetHeight - size.height) / 2),
    };
}

/**
 * Gets a portrait bounding box for the canvas element based on the content source and aspect ratio
 * Disregards generated bars from the browser
 * @param contentSource The HTML content element
 * @param aspectRatio The requested aspect ratio
 */
export function createPortraitBoundingBox(contentSource: ContentSource, aspectRatio: number): IBoundingBox {
    Guard.null(contentSource);

    const size = {
        width: contentSource.offsetHeight * aspectRatio,
        height: contentSource.offsetHeight,
    };

    return {
        width: size.width,
        height: size.height,
        left: contentSource.offsetLeft + ((contentSource.offsetWidth - size.width) / 2),
        top: contentSource.offsetTop,
    };
}
