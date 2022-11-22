import * as React from "react";
import {Creatable as ReactSelect} from "react-select";
import {Field} from "redux-form";

import {TouchTapEvent} from "material-ui";
import Checkbox from "material-ui/Checkbox";
import SelectField from "material-ui/SelectField";
import TextField from "material-ui/TextField";


export const FormField = Field as new () => Field;

export const ReduxFormMultiSelectField = Field as new () => Field;


export class TextFormField extends React.Component<IProps, {}> {
    public render() {
        return (
            <TextField
                hintText={this.props.hintText || this.props.text}
                floatingLabelText={this.props.text}
                errorText={this.props.meta.touched && this.props.meta.error}
                type={this.props.type}
                disabled={this.props.disabled}
                fullWidth={this.props.fullWidth}
                multiLine={this.props.multiLine}
                style={this.props.style}
                floatingLabelStyle={this.props.customStyle}
                // inputProps={this.props.inputProps}
                {...this.props.input}
            />
        );
    }
};


export class CheckboxFormField extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.onCheck = this.onCheck.bind(this);
    }

    public render() {
        return (
            <Checkbox
                id={this.props.text}
                label={this.props.text}
                {...this.props.input}
                onCheck={this.onCheck}
                checked={this.props.input.value ? true : false}
                style={this.props.style}
            />
        );
    }

    private onCheck(_: React.MouseEvent<any>, checked: boolean) {
        this.props.input.onChange(checked);
    }
};


export class SelectFormField extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    public render() {
        return (
            <SelectField
                hintText={this.props.text}
                floatingLabelText={this.props.text}
                floatingLabelStyle={this.props.customStyle}
                errorText={this.props.meta.touched && this.props.meta.error}
                fullWidth={this.props.fullWidth}
                style={this.props.style}
                {...this.props.input}
                onChange={this.onChange}
                value={this.props.input.value}
                children={this.props.children}
            />
        );
    }

    private onChange(e: TouchTapEvent, index: number, menuItemValue: any) {
        this.props.input.onChange(menuItemValue);
        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(menuItemValue);
        }
    }
};


export class SelectFormInput extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.onBlur = this.onBlur.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    public render() {
        return (
            <ReactSelect
                {...this.props}
                value={this.extractInputValue()}
                onBlur={this.onBlur}
                onChange={this.onChange}
                options={this.props.options}
                style={this.props.style}
            />
        );
    }

    protected extractInputValue() {
        return this.props.input.value || "";
    }

    protected extractSelectedValue() {
        return (entry) => entry.value;
    }

    private onChange(event: Array<{label: string, value: any}>) {
        if (this.props.input.onChange) {
            this.props.input.onChange(event.map(this.extractSelectedValue()));
        }
    }

    private onBlur() {
        this.props.input.onBlur(this.props.input.value);
    }
};


export class OpenbachFunctionIdFormInput extends SelectFormInput {
    protected extractInputValue() {
        return (this.props.input.value || []).map((value) => value.length === 1 ? value[0] : value);
    }

    protected extractSelectedValue() {
        return (entry) => [entry.value];
    }
};


export class HiddenFormField extends React.Component<IProps, {}> {
    public render() {
        return <div style={this.props.style} />;
    }
};


export interface IProps {
    customStyle?: React.CSSProperties;
    disabled?: boolean;
    fullWidth?: boolean;
    hintText?: string;
    input?: any;
    meta?: any;
    multiLine?: boolean;
    name?: string;
    onSelectionChange?: (selection: string) => void;
    options?: Array<{label: string, value: any}>;
    style?: React.CSSProperties;
    text?: string;
    type?: string;
    value?: string;
    inputProps?: Object;
};
