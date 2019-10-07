import { reducer } from "./trackingReducer";
import { createTrackingAction, TrackingActionType, ITrackingAction } from "../../models/trackingAction";
import {
    trackingImgDeleteAction,
    trackingImgInAction,
    trackingSignInAction,
    trackingSignOutAction,
    trackingImgOutAction,
} from "../actions/trackingActions";

describe("Tracking Reducer", () => {
    beforeEach(() => {
        Date.now = jest.fn();
    });

    it("Adds new tracking action by track sign in action", () => {
        const testTracking: ITrackingAction = createTrackingAction(TrackingActionType.ImgIn, 2);
        const newTracking: ITrackingAction = createTrackingAction(TrackingActionType.SignIn, 2);
        const trackings: ITrackingAction[] = [testTracking];
        const action = trackingSignInAction(newTracking);

        const result = reducer(trackings, action);
        expect(result).toEqual([testTracking, newTracking]);
    });

    it("Adds new tracking action by track sign out action", () => {
        const testTracking: ITrackingAction = createTrackingAction(TrackingActionType.SignIn, 2);
        const newTracking: ITrackingAction = createTrackingAction(TrackingActionType.SignOut, 2);
        const trackings: ITrackingAction[] = [testTracking];
        const action = trackingSignOutAction(newTracking);

        const result = reducer(trackings, action);
        expect(result).toEqual([testTracking, newTracking]);
    });

    it("Adds new tracking action by track img in action", () => {
        const testTracking: ITrackingAction = createTrackingAction(TrackingActionType.ImgOut, 2);
        const newTracking: ITrackingAction = createTrackingAction(TrackingActionType.ImgIn, 2);
        const trackings: ITrackingAction[] = [testTracking];
        const action = trackingImgInAction(newTracking);

        const result = reducer(trackings, action);
        expect(result).toEqual([testTracking, newTracking]);
    });

    it("Adds new tracking action by track img out action", () => {
        const testTracking: ITrackingAction = createTrackingAction(TrackingActionType.ImgIn, 2);
        const newTracking: ITrackingAction = createTrackingAction(TrackingActionType.ImgOut, 2);
        const trackings: ITrackingAction[] = [testTracking];
        const action = trackingImgOutAction(newTracking);

        const result = reducer(trackings, action);
        expect(result).toEqual([testTracking, newTracking]);
    });

    it("Adds new tracking action by track img delete action", () => {
        const testTracking: ITrackingAction = createTrackingAction(TrackingActionType.ImgDelete, 2);
        const newTracking: ITrackingAction = createTrackingAction(TrackingActionType.ImgIn, 2);
        const trackings: ITrackingAction[] = [testTracking];
        const action = trackingImgDeleteAction(newTracking);

        const result = reducer(trackings, action);
        expect(result).toEqual([testTracking, newTracking]);
    });
});
