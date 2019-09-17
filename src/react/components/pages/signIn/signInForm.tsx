import React from "react";
import Form, { FormValidation, Widget } from "react-jsonschema-form";
import { ISignIn } from "../../../../models/applicationState";

const formSchema = require("./signInForm.json");
const uiSchema = require("./signInForm.ui.json");


// Interface for properties
export interface ISignInFormProps extends React.Props<SignInForm> {
    signin: ISignIn; // described in models/applicationState.ts
    onSubmit: (signin: ISignIn) => void; // submission function, has signin form as parameter
}

// Interface for state
export interface ISignInFormState {
    formSchema: any;
    uiSchema: any;
    formData: ISignIn;
}
/*
    const formats = {
        'email' : /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    }
*/
export default class SignInForm extends React.Component<ISignInFormProps, ISignInFormState> {
    constructor(props) {
        super(props);
        this.state = {
            formSchema : { ...formSchema },
            uiSchema : { ...uiSchema },
            formData : this.props.signin
        }
    }


    public render() {
        return (
            <div>
                <Form
                    schema = {this.state.formSchema}
                    uiSchema = {this.state.uiSchema}
                    formData = {this.state.formData}
                    //customFormats = {formats}
                    onSubmit = {(form) => this.props.onSubmit(form.formData)}
                >
                <div>
                    <button type="submit" className="btn btn-success">Submit</button> 
                </div>
                </Form>
            </div>
        )
    }
}
