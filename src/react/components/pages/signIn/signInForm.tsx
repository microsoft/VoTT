import React from "react";
import Form, { FormValidation, Widget } from "react-jsonschema-form";
import { ISignIn } from "../../../../models/applicationState";

const formSchema = require("./signInForm.json");
const uiSchema = require("./signInForm.ui.json");


export interface ISignInFormProps extends React.Props<SignInForm> {
    signin: ISignIn;
    onSubmit: (signin: ISignIn) => void;
}

export interface ISignInFormState {
    formSchema: any;
    uiSchema: any;
    formData: ISignIn;
}


export default class SignInForm extends React.Component<ISignInFormProps, ISignInFormState> {
    constructor(props) {
        super(props);
        this.state = {
            formSchema : { ...formSchema },
            uiSchema : { ...uiSchema },
            formData : this.props.signin
        }
    }
    
    private onSubmit = (form) => {
        console.log(form.formData)
        this.props.onSubmit(form.formData);

    }

    public render() {
        return (
            <div className="app-signin-page-form p-3">
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
        )
    }
}
