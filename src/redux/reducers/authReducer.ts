import { ActionTypes } from "../actions/actionTypes";
import { IAuth } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";

export const reducer = (state: IAuth = null, action: AnyAction): IAuth => {
    switch (action.type) {
        case ActionTypes.SIGN_IN_SUCCESS:
            return { ...state, ...action.payload };
        case ActionTypes.SIGN_OUT_SUCCESS:
            return { ...state, accessToken: null, fullName: null, rememberUser: null };
        case ActionTypes.SAVE_USER_INFO_SUCCESS:
            return { ...state, ...action.payload};
        default:
            return state;
    }
};
