import React from "react";
import { Redirect } from "react-router-dom";
import apiService from "../../../services/apiService";
import { Route } from "react-router-dom";

export interface ILoggedInRouteProps extends React.Props<LoggedInRoute> {
    component: any;
    path?: string;
    exact?: boolean;
}

export interface ILoggedInRouteState {
    isAuth: boolean;
    loading: boolean;
}

export default class LoggedInRoute extends React.Component<ILoggedInRouteProps, ILoggedInRouteState> {
    constructor(props) {
        super(props);
        this.state = {
            isAuth: false,
            loading: true,
        };
    }

    public async componentDidMount() {
        this.setState({loading: true});
        try {
            await apiService.testToken();
            this.setState({isAuth: true});
        } catch {
            this.setState({isAuth: false});
        } finally {
            this.setState({loading: false});
        }
    }

    public render() {
        if (this.state.loading) {
            return  <div>
                        <i className="fas fa-circle-notch fa-spin fa-2x" />
                    </div>;
        } else if (this.state.isAuth) {
            return <Route path={this.props.path} exact={this.props.exact} component={this.props.component} />;
        } else {
            return <Redirect to="/sign-in" />;
        }
    }

}
