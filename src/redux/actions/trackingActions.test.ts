import thunk from "redux-thunk";
import initialState from "../store/initialState";
import { IApplicationState } from "../../models/applicationState";
import createMockStore, { MockStoreEnhanced } from "redux-mock-store";
import MockFactory from "../../common/mockFactory";
import * as trackingActions from "./trackingActions";
import { ActionTypes } from "./actionTypes";
import { TrackingActionType, ITrackingAction, createTrackingAction } from "../../models/trackingAction";

describe("Tracking Redux Actions", () => {
    const appSettings = MockFactory.appSettings();
    let store: MockStoreEnhanced<IApplicationState>;

    beforeEach(() => {
        const middleware = [thunk];
        const mockState: IApplicationState = {
            ...initialState,
            appSettings,
        };
        Date.now = jest.fn();
        store = createMockStore<IApplicationState>(middleware)(mockState);
    });

    it("Sign in tracking action dispatches redux action", async () => {
        await trackingActions.trackingSignIn(1)(store.dispatch);
        const trackingObject: ITrackingAction = createTrackingAction(
            TrackingActionType.SignIn,
            1);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.TRACK_SIGN_IN_SUCCESS,
            payload: trackingObject,
        });
    });

    it("Sign out tracking action dispatches redux action", async () => {
        await trackingActions.trackingSignOut(1)(store.dispatch);
        const trackingObject: ITrackingAction = createTrackingAction(
            TrackingActionType.SignOut,
            1);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.TRACK_SIGN_OUT_SUCCESS,
            payload: trackingObject,
        });
    });

    it("Img in tracking action dispatches redux action", async () => {
        await trackingActions.trackingImgIn(1, "id", [])(store.dispatch);
        const trackingObject: ITrackingAction = createTrackingAction(
            TrackingActionType.ImgIn,
            1,
            "id");
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.TRACK_IMG_IN_SUCCESS,
            payload: trackingObject,
        });
    });

    it("Img out tracking action dispatches redux action", async () => {
        await trackingActions.trackingImgOut(1, "id", [])(store.dispatch);
        const trackingObject: ITrackingAction = createTrackingAction(
            TrackingActionType.ImgOut,
            1,
            "id");
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.TRACK_IMG_OUT_SUCCESS,
            payload: trackingObject,
        });
    });

    it("Img delete tracking action dispatches redux action", async () => {
        await trackingActions.trackingImgDelete(1, "id")(store.dispatch);
        const trackingObject: ITrackingAction = createTrackingAction(
            TrackingActionType.ImgDelete,
            1,
            "id");
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.TRACK_IMG_DELETE_SUCCESS,
            payload: trackingObject,
        });
    });
});
