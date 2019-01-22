import React from "react";
import Form from "react-jsonschema-form";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { ITag } from "../../../../models/applicationState";
import { tagColors } from "./tagColors";

const defaultValues = {
    tagColors,
    tagNameText: "Tag",
    editTagText: "Edit Tag",
    tagColorText: "Color",
    saveText: "Save",
    cancelText: "Cancel",
};

/**
 * Properties for Tag Editor Modal
 * @member tag - Tag for editing
 * @member showModal - Modal is visible
 * @member onOk - Function to call when "Ok" button is clicked
 * @member onCancel - Function to call when "Cancel" button is clicked or modal closed
 */
export interface ITagEditorModalProps {
    onOk: (tag: ITag) => void;

    // Props with default params
    tagColors?: {[id: string]: string};
    tagNameText?: string;
    tagColorText?: string;
    editTagText?: string;
    saveText?: string;
    cancelText?: string;

    // Optional
    show?: boolean;
    onCancel?: () => void;
}

/**
 * State for Tag Editor Modal
 * @member tag - Current tag being edited
 * @member isOpen - Modal is open
 */
export interface ITagEditorModalState {
    tag: ITag;
    isOpen: boolean;
    formSchema: any;
}

/**
 * Simple modal for editing the name and color of project tags
 */
export default class TagEditorModal extends React.Component<ITagEditorModalProps, ITagEditorModalState> {

    private tagColors: {[id: string]: string};

    constructor(props: ITagEditorModalProps) {
        super(props);

        this.tagColors = props.tagColors || defaultValues.tagColors;

        this.state = {
            tag: null,
            isOpen: props.show,
            formSchema: this.createFormSchema(
                this.tagColors,
                this.props.tagNameText || defaultValues.tagNameText,
                this.props.tagColorText || defaultValues.tagColorText),
        };

        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleOk = this.handleOk.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
    }

    public render() {
        const closeBtn = <button className="close" onClick={this.close}>&times;</button>;

        return (
            <div>
                <Modal isOpen={this.state.isOpen} centered={true}>
                    <ModalHeader toggle={this.close} close={closeBtn}>
                        {this.props.editTagText || defaultValues.editTagText}
                    </ModalHeader>
                    <ModalBody>
                        <Form
                            schema={this.state.formSchema}
                            formData={this.state.tag}
                            onChange={this.handleFormChange}>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="success"
                            onClick={this.handleOk}>{this.props.saveText || defaultValues.saveText}</Button>
                        <Button
                            color="secondary"
                            onClick={this.close}>{this.props.cancelText || defaultValues.cancelText}</Button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }

    public open(tag: ITag): void {
        this.setState({
            isOpen: true,
            tag,
        });
    }

    public close(): void {
        this.setState({
            isOpen: false,
        }, () => {
            if (this.props.onCancel) {
                this.props.onCancel();
            }
        });
    }

    /**
     * Called when change made to modal form
     */
    private handleFormChange(args) {
        this.setState({
            tag: {
                name: args.formData.name,
                color: args.formData.color,
            },
        });
    }

    /**
     * Called when "Ok" is clicked
     */
    private handleOk(e) {
        this.props.onOk(this.state.tag);
    }

    private createFormSchema(colors: {[id: string]: string}, tagNameText: string, tagColorText: string) {
        const keys = Object.keys(colors);
        const values: string[] = [];
        for (const key of keys) {
            values.push(colors[key]);
        }
        return {
            type: "object",
            properties: {
                name: {
                    title: tagNameText,
                    type: "string",
                },
                color: {
                    title: tagColorText,
                    type: "string",
                    enum: values,
                    default: values[0],
                    enumNames: keys,
                },
            },
        };
    }
}
