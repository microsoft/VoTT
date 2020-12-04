import React from "react";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { EditorContext, IAssetMetadata, IProject, IRegion, ISegment } from "../../../../models/applicationState";
import { JSONSchema6 } from "json-schema";
import SegmentCanvas from "../../pages/editorPage/segment/segmentCanvas";
import { update } from "lodash";

const formSchemaForSegment = {
    "title": "Segment property",
    "type": "object",
    "properties": {
      "tag": {
        "type": "string"
      },
      "iscrowd": {
        "type": "boolean"
      }
    }
}

const uiSchema =  {
    iscrowd: {
      "ui:widget": "radio" // could also be "select"
    }
};

export interface IPropertyFormProps extends React.Props<PropertyForm> {
    selectedAssetName: string,
    editorContext: EditorContext;
    selectedRegions: IRegion[];
    selectedSegment: ISegment;
    onIsCrowdChange: (value: number) => void;
    onSegmentChange: (segment: ISegment) => void;
}

export interface IPropertyFormState {
    iscrowd: boolean;
    formSchema: object;
    formData: object;
}

/**
 * @name - Property Form
 * @description - Form for editing properties of choosen assets
 */
export default class PropertyForm extends React.Component<IPropertyFormProps, IPropertyFormState> {
    public static defaultProps: IPropertyFormProps = {
        selectedAssetName: "",
        editorContext: EditorContext.Geometry,
        selectedRegions: [],
        selectedSegment: undefined,
        onIsCrowdChange: undefined,
        onSegmentChange: undefined,
    }

    public state: IPropertyFormState = {
        iscrowd: false,
        formSchema: undefined,
        formData: undefined,
    }

    constructor(props){
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.updateForm = this.updateForm.bind(this);
        this.clearForm = this.clearForm.bind(this);
    }

    public componentDidUpdate(prevProps: IPropertyFormProps){
        if (this.props.editorContext === EditorContext.Segment){
            if (this.props.selectedAssetName !== prevProps.selectedAssetName){
                this.clearForm();
            }
            else if (this.props.selectedSegment){
                if (!this.state.formData){
                    console.log(this.props.selectedSegment);
                    this.updateForm(this.props.selectedSegment, formSchemaForSegment);
                }
                if(this.props.selectedSegment !== prevProps.selectedSegment){
                    this.updateForm(this.props.selectedSegment, formSchemaForSegment);
                }
            }
            else if (this.state.formData) {
                this.clearForm();
            }
        }
    }

    public clearForm(){
        this.setState( { formData: undefined } );
    }

    public updateForm(segment: ISegment, formSchema: object){
        const formData = this.projectSegmentIntoFormData(segment, formSchema);
        this.setState( { formData } );
    }

    public render() {
        console.log(this.props.selectedAssetName);
        console.log(this.props.selectedSegment);
        console.log(this.state.formData);
        return (
            this.state.formData ?
            <Form
                className={"testtest"}
                schema={ formSchemaForSegment as JSONSchema6}
                uiSchema={uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                />
            : "Please choose region/segment to configure."
        );
    }

    public updateSegmentProperty(value: number){
        this.setState( { iscrowd: value === 1 });
    }

    private projectSegmentIntoFormData(segment: ISegment, formSchema: object){
        const segmentAttributes = Object.getOwnPropertyNames(segment);
        let projected = {};
        for (const key in formSchema)
        {
            if(key === "properties")
            {
                for (const attr in formSchema[key]){
                    if (segmentAttributes.includes(attr)){
                        if (formSchema[key][attr]["type"] === "boolean"){
                            projected = {...projected, [attr]: segment[attr] === 1};
                        } else {
                            projected = {...projected, [attr]: segment[attr]};
                        }
                    }
                }
            }
        }
        return projected;
    }

    private onFormChange = (changeEvent: IChangeEvent<IPropertyFormProps>) => {
        if (this.props.onSegmentChange) {
            console.log(changeEvent);
            //this.props.onSegmentChange(changeEvent.formData);
        }
    }

    private handleInputChange(event){
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.props.onIsCrowdChange(value ? 1 : 0);
        this.updateSegmentProperty(value ? 1 : 0);
    }

    private showProperties(segment: ISegment){
        if (this.props.editorContext === EditorContext.Segment && this.props.selectedSegment){
            return <div><h2>{segment.tag}</h2>
                <p>iscrowd : <input
                name="iscrowd"
                type="checkbox"
                checked={this.state.iscrowd}
                onChange={this.handleInputChange} />
                </p></div>;
        }
        else if(this.props.editorContext === EditorContext.Geometry && this.props.selectedRegions){
            return this.props.selectedRegions.length;
        }
        else {
            return ;
        }
    }
}