import * as React from "react";
import { ISignIn, IAuth } from "../../../../models/applicationState";
import { SignInForm } from "./signInForm";
import { Route, Redirect } from "react-router-dom";
import apiService, { ILoginRequestPayload } from "../../../../services/apiService";
import IAuthActions, * as authActions from "../../../../redux/actions/authActions";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { IApplicationState } from "../../../../models/applicationState";
import history from "../../../../history";
import { toast } from "react-toastify";

export interface ISignInPageProps extends React.Props<SignInPage> {
    actions: IAuthActions;
    signIn: ISignIn;
    apiService: any;
}

export interface ISignInPageState {
    signIn: ISignIn;
    loginRequestPayload: ILoginRequestPayload;
    auth: IAuth;
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
    constructor(props) {
        super(props);
        this.state = {
            signIn: props.signIn || null,
            loginRequestPayload: null,
            auth: null,
        };
        this.onFormSubmit = this.onFormSubmit;
    }

    public render() {
        return (
            <div className="app-sign-in-page-form">
                <Route exact path="/login">
                    <div>
                        <SignInForm
                            signIn={this.state.signIn}
                            onSubmit={this.onFormSubmit}
                        />
                    </div>
                </Route>
            </div>
        );
    }

    private onFormSubmit = (signIn: ISignIn) => {
        this.setState({
            loginRequestPayload: {
                username: signIn.email,
                password: signIn.password,
            },
        }, () => {
            this.sendCredentials(signIn.rememberUser);
        });
    }

    private async sendCredentials(rememberUser: boolean) {
        try {
            const token = await apiService.loginWithCredentials(this.state.loginRequestPayload);
            this.setState({
                auth: {
                    accessToken: token.data.access_token,
                    fullName: null,
                    rememberUser,
                },
            });
            await this.props.actions.signIn(this.state.auth);
            const userInfo = await apiService.getCurrentUser();
            await this.props.actions.saveFullName(userInfo.data.full_name);
            history.push("/");

        } catch (error) {
            let errorMessage;
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = "Incorrect email or password.";
                } else {
                    errorMessage = "Sorry, something went wrong...";
                }
            } else {
                errorMessage = "Sorry, something went wrong...";
            }
            toast.error(errorMessage, { position: toast.POSITION.TOP_CENTER} );
        }
    }
}
