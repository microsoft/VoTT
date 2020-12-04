import React from "react";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { EditorContext, IAssetMetadata, IProject, IRegion, ISegment } from "../../../../models/applicationState";
import { JSONSchema6 } from "json-schema";
import SegmentCanvas from "../../pages/editorPage/segment/segmentCanvas";

const formSchemaForSegment = {
    "title": "My title",
    "description": "My description",
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "age": {
        "type": "boolean"
      }
    }
}

const uiSchema =  {
    age: {
      "ui:widget": "radio" // could also be "select"
    }
};

export interface IPropertyFormProps extends React.Props<PropertyForm> {
    editorContext: EditorContext;
    selectedRegions: IRegion[];
    selectedSegment: ISegment;
    onIsCrowdChange: (value: number) => void;
}

export interface IPropertyFormState {
    iscrowd: boolean;
    formSchema: object;
}

/**
 * @name - Property Form
 * @description - Form for editing properties of choosen assets
 */
export default class PropertyForm extends React.Component<IPropertyFormProps, IPropertyFormState> {
    public static defaultProps: IPropertyFormProps = {
        editorContext: EditorContext.Geometry,
        selectedRegions: [],
        selectedSegment: undefined,
        onIsCrowdChange: undefined,
    }

    public state: IPropertyFormState = {
        iscrowd: false,
        formSchema: undefined,
    }

    constructor(props){
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    public componentDidUpdate(prevProps: IPropertyFormProps){
        if(this.props.selectedSegment){
            if(this.props.selectedSegment !== prevProps.selectedSegment){
                this.updateSegmentProperty(this.props.selectedSegment.iscrowd);
            }
        }

        if (this.props.editorContext === EditorContext.Segment){
        }
    }

    public render() {
        return (
            <Form
                className={"testtest"}
                schema={ formSchemaForSegment as JSONSchema6}
                uiSchema={uiSchema}
                />
            //<div>{this.showProperties(this.props.selectedSegment)}</div>
        );
    }

    public updateSegmentProperty(value: number){
        this.setState( { iscrowd: value === 1 });
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
            return "Please choose region/segment to configure.";
        }
    }
}