import React from "react"
import { ISignIn } from "../../../../models/applicationState";
import SignInForm from "./signInForm";
import { Route, Redirect } from "react-router-dom";
import ApiService from "../../../../services/apiService"
import IAuthActions, * as authActions from "../../../../redux/actions/authActions";
import { showError } from "../../../../redux/actions/appErrorActions";


export interface ISignInPageProps extends React.Props<SignInPage> {
    actions: IAuthActions;
}

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

    private async onFormSubmit(signin: ISignIn) {
        ApiService.loginWithCredentials(signin).then( token => {
                this.props.actions.signIn(token.data)
                return <Redirect to="homepage" />
            }
        ).catch(e => console.log(e))
    }

    public render() {
        return (
            <div className="app-signin-page-form">
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