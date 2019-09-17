import React from "react"
import { ISignIn } from "../../../../models/applicationState";
import SignInForm from "./signInForm";
import { Route, Redirect } from "react-router-dom";
import ApiService, { ILoginRequestPayload } from "../../../../services/apiService"
import IAuthActions, * as authActions from "../../../../redux/actions/authActions";

export interface ISignInPageProps extends React.Props<SignInPage> {
    actions: IAuthActions;
}

export interface ISignInPageState {
    signin: ISignIn;
    loginRequestPayload: ILoginRequestPayload;
}

export default class SignInPage extends React.Component<ISignInPageProps, ISignInPageState> {
    constructor(props){
        super(props);
        this.state = {
            signin: null,
            loginRequestPayload: null,
        };
        this.onFormSubmit = this.onFormSubmit.bind(this);

    }

    private async onFormSubmit(signin: ISignIn) {

        this.setState({
            loginRequestPayload: {
                username: signin.email,
                password: signin.password,
            }
        })

        try {
            const token = await ApiService.loginWithCredentials(this.state.loginRequestPayload);
            await this.props.actions.signIn(token.data)
            return <Redirect to="/" />
        }catch(error){
            console.log(error)
        }
    }
    public render() {
        return (
            <div className="app-signin-page-form">
                <Route exact path="/login">
                    <div>
                        <SignInForm
                            signin={this.state.signin}
                            onSubmit={this.onFormSubmit}
                        />
                    </div>
                </Route>
            </div>
        )
    }


}