import * as React from "react";
import Form from "react-jsonschema-form";
import { ISignIn } from "../../../../models/applicationState";

import formSchema from "./signInForm.json";
import uiSchema from "./signInForm.ui.json";

export interface ISignInFormProps extends React.Props<SignInForm> {
    signIn: ISignIn;
    onSubmit: (signIn: ISignIn) => void;
}

export interface ISignInFormState {
    formSchema: any;
    uiSchema: any;
    formData: ISignIn;
}

export class SignInForm extends React.Component<ISignInFormProps, ISignInFormState> {
    constructor(props) {
        super(props);
        this.state = {
            formSchema : { ...formSchema },
            uiSchema : { ...uiSchema },
            formData : this.props.signIn,
        };
    }

    public render() {
        return (
            <div className="app-sign-in-page-form p-3">
                <h3 className="mb-3">
                    Sign in
                </h3>
                <div className="m-3">
                    <Form
                        schema={this.state.formSchema}
                        uiSchema={this.state.uiSchema}
                        formData={this.state.formData}
                        onSubmit={this.onSubmit}
                    >
                    <div>
                        <button type="submit" className="btn btn-success">Submit</button>
                    </div>
                    </Form>
                </div>
            </div>
        );
    }

    private onSubmit = (form) => {
        this.props.onSubmit(form.formData);
    }
}
