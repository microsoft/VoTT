import React from "react"
import { ISignIn } from "../../../../models/applicationState";
import SignInForm from "./signInForm";
import { Route } from "react-router-dom";
import ApiService from "../../../../services/apiService"

export interface ISignInPageProps extends React.Props<SignInPage> {}

export interface ISignInPageState {
    signin: ISignIn;
}

export default class SignInPage extends React.Component<ISignInPageProps, ISignInPageState> {
    constructor(props){
        super(props);
        this.state = {
            signin: null,
        };
        this.onFormSubmit = this.onFormSubmit.bind(this);

    }

    private onFormSubmit(signin: ISignIn) {
        ApiService.loginWithCredentials(signin); // returns access token / error
        // then authAction with the access token? or show error
        // if login redirect to homepage
    }

    public render() {
        return (
            <div className="app-signin-page">
                <Route exact path="/login">
                    <SignInForm
                        signin={this.state.signin}
                        onSubmit={this.onFormSubmit}
                    />
                </Route>
            </div>
        )
    }


}