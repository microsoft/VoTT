import { IRegion } from "./applicationState";

export interface ITrackingAction {
    type: TrackingActionType;
    timestamp: number;
    userId: number;
    imageId: string;
    regions: IRegion[];
    isModified: boolean;
}

/**
 * Actions which are tracked
 * @enum ImgIn - Enters on the image
 * @enum ImgOut - Leaves the image
 * @enum ImgDelete - Deletes the image
 * @enum SignOut - Sign out from the account
 * @enum SignIn - Sign in to the account
 */
export enum TrackingActionType {
    ImgIn = "img_in",
    ImgOut = "img_out",
    ImgDelete = "img_delete",
    SignOut = "logout",
    SignIn = "login"
}

export class TrackingAction implements ITrackingAction {
    public timestamp = Date.now();
    public type: TrackingActionType;
    public userId: number;
    public imageId: string;
    public regions: IRegion[];
    public isModified: boolean;

    constructor(
        type: TrackingActionType,
        userId: number,
        imageId: string = null,
        regions: IRegion[] = [],
        isModified: boolean = false
    ) {
        this.type = type;
        this.userId = userId;
        this.imageId = imageId;
        this.regions = regions;
        this.isModified = isModified;
    }
}

export const createTrackingAction = (
    type: TrackingActionType,
    userId: number,
    imageId?: string,
    regions?: IRegion[],
    isModified?: boolean // tslint:disable-line
) => {
    return new TrackingAction(type, userId, imageId, regions, isModified);
};
