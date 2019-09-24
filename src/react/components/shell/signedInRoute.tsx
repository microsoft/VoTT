import React from "react";
import { Route, Redirect } from "react-router-dom";
import ApiService from "../../../services/apiService";

export default function LoggedInRoute({component: Component, ...rest}) {
    return (
        <Route
        {...rest}
        render={ (props) =>
            !ApiService.getToken() ? <Component {...props} /> : <Redirect to="/" />
        } />
    );
}
