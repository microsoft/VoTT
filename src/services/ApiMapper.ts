import { ITrackingAction } from "../models/trackingAction";
import { IActionRequest } from "./apiService";

export const mapTrackingActionToApiBody = (action: ITrackingAction): IActionRequest => {
    return {
        type: action.type,
        timestamp: `${action.timestamp}`,
        regions: action.regions,
        is_modified: action.isModified,
        user_id: action.userId,
        image_id: 3 // TODO: Add image_id from the DB
    };
};
