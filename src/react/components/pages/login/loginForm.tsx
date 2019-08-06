import React from "react";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { addLocValues, strings } from "../../../../common/strings";
import { ILoginInfo } from "../../../../models/applicationState";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import ProjectForm from "../projectSettings/projectForm";
import ProjectSettingsPage from "../projectSettings/projectSettingsPage";
//import "vott-react/dist/css/tagsInput.css";

// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./loginForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./loginForm.ui.json"));

/**
 * Required properties for Project Settings form
 * @member login - Current project to fill form
 * @member onSubmit - Function to call on form submission
 * @member onCancel - Function to call on form cancellation
 */
export interface ILoginFormProps extends React.Props<LoginForm> {
    login: ILoginInfo;
    onSubmit: (login: ILoginInfo) => void;
    onChange?: (login: ILoginInfo) => void;
    onCancel?: () => void;
}

/**
 * Project Form State
 * @member classNames - Class names for HTML form element
 * @member formData - data containing details of project
 * @member formSchema - json schema of form
 * @member uiSchema - json UI schema of form
 */
export interface ILoginFormState {
    classNames: string[];
    formData: ILoginInfo;
    formSchema: any;
    uiSchema: any;
}

/**
 * @name - Login Form
 * @description - Form for editing or creating VoTT projects
 */
export default class LoginForm extends React.Component<ILoginFormProps, ILoginFormState> {


    constructor(props, context) {
        super(props, context);
        this.state = {
            classNames: ["needs-validation"],
            uiSchema: { ...uiSchema },
            formSchema: { ...formSchema },
            formData: {
                ...this.props.login,
            },
        };
       
        this.onFormSubmit = this.onFormSubmit.bind(this);
        //this.onFormValidate = this.onFormValidate.bind(this);
    }
    /**
     * Updates state if project from properties has changed
     * @param prevProps - previously set properties
     */
    public componentDidUpdate(prevProps: ILoginFormProps) {
        if (prevProps.login !== this.props.login) {
            this.setState({
                formData: { ...this.props.login },
            });
        }
    }

    public render() {
        return (
            <div>
                
                <Form
                    className={this.state.classNames.join(" ")}
                    showErrorList={false}
                    liveValidate={true}
                    noHtml5Validate={true}
                    FieldTemplate={CustomFieldTemplate}
                // validate={this.onFormValidate}
                    schema={this.state.formSchema}
                    uiSchema={this.state.uiSchema}
                    formData={this.state.formData}
                    onSubmit={this.onFormSubmit}>
                    <div>
                        <button className="btn btn-success mr-1" type="submit">{strings.login.submit}</button>
                    </div>
                </Form>
            </div>
        );
    }


  /*  private onFormValidate(login: ILoginInfo, errors: FormValidation) {
        if (Object.keys(login.username).length === 0) {
            errors.username.addError("is a required property");
        }

        if (Object.keys(login.password).length === 0) {
            errors.password.addError("is a required property");
        }

        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }
*/


    private onFormSubmit(args: ISubmitEvent<ILoginInfo>) {
        const login: ILoginInfo = {
            ...args.formData,
        };
        this.props.onSubmit(login);
    }

    
}
