import React from "react";
import { Redirect, Route } from "react-router-dom";
import ApiService from "../../../services/apiService";

export interface IAnonymousRouteProps extends React.Props<AnonymousRoute> {
    component: any;
    path?: string;
    exact?: boolean;
}

export interface IAnonymousRouteState {
    isAuth: boolean;
    loading: boolean;
}

export default class AnonymousRoute extends React.Component<IAnonymousRouteProps, IAnonymousRouteState> {
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
            await ApiService.testToken();
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
        }
        return <Redirect to="/sign-in" />;
    }
}
