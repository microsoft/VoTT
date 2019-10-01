import React from "react";
import { Redirect, Route } from "react-router-dom";
import AnonymousRoute from "./anonymousRoute";

export default class SignedInRoute extends AnonymousRoute {
    constructor(props) {
        super(props);
    }

    public render() {
        if (this.state.loading) {
            return  <div>
                        <i className="fas fa-circle-notch fa-spin fa-2x" />
                    </div>;
        } else if (this.state.isAuth) {
            return <Redirect to="/" />;
        } else {
            return <Route path={this.props.path} exact={this.props.exact} component={this.props.component} />;
        }
    }

}
