import React from "react"
import { ISignIn } from "../../../../models/applicationState";
import SignInForm from "./signInForm";
import { Route, Redirect } from "react-router-dom";
import ApiService, { ILoginRequestPayload } from "../../../../services/apiService"
import IAuthActions, * as authActions from "../../../../redux/actions/authActions";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { IApplicationState } from "../../../../models/applicationState";
import history from "../../../../history"
import { toast } from "react-toastify";

export interface ISignInPageProps extends React.Props<SignInPage> {
    actions: IAuthActions;
    signin: ISignIn;
}

export interface ISignInPageState {
    signin: ISignIn;
    loginRequestPayload: ILoginRequestPayload;
}

function mapStateToProps(state: IApplicationState) {
    return {
        auth: state.auth,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(authActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class SignInPage extends React.Component<ISignInPageProps, ISignInPageState> {
    constructor(props){
        super(props);
        this.state = { 
            signin: null,
            loginRequestPayload: null,
        };
        ApiService.removeToken();
        this.onFormSubmit = this.onFormSubmit.bind(this);

    }

    private async onFormSubmit(signin: ISignIn) {
        this.setState({
            loginRequestPayload: {
                username: signin.email,
                password: signin.password,
            }
        }, () => {
            this.sendCredentials()
        })
    }

    private async sendCredentials() {
        try {
            const token = await ApiService.loginWithCredentials(this.state.loginRequestPayload);
            localStorage.setItem("token", token.data.access_token);
            await this.props.actions.signIn(token.data.access_token);
            history.push("/");
            
        }catch(error){
            console.log(error)
            toast.error("Sorry, we could not log you in!",{position:toast.POSITION.TOP_CENTER})
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