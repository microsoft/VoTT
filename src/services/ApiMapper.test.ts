import { createTrackingAction, TrackingActionType } from "../models/trackingAction";
import { mapTrackingActionToApiBody } from "./ApiMapper";

describe("Api Mapper", () => {
    it("maps tracking action to api body", () => {
        const trackingAction = createTrackingAction(TrackingActionType.ImgIn, 3, "3", [], true);
        const mappedAction = mapTrackingActionToApiBody(trackingAction);
        expect(mappedAction).toEqual({
            type: trackingAction.type,
            timestamp: `${trackingAction.timestamp}`,
            regions: trackingAction.regions,
            is_modified: trackingAction.isModified,
            user_id: trackingAction.userId,
            image_id: parseInt(trackingAction.imageId, 10)
        });
    });
});
