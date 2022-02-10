import * as React from "react";
import {FieldArray} from "redux-form";

import IconButton from "material-ui/IconButton";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";

import {IJob, IJobArgument, IJobSubcommand, IJobSubcommandGroup} from "../../../interfaces/job.interface";
import {IStartJobParameters, TStartJobParameterValue} from "../../../interfaces/project.interface";
import {IOpenbachFunctionForm, IOpenbachSubcommandForm} from "../../../interfaces/scenarioForm.interface";
import TitledPaper from "../../common/TitledPaper";

import {FormField, SelectFormField} from "../../common/Form";
import RepeatableJobParameters from "./RepeatableJobParameters";


const fieldStyle: React.CSSProperties = {
        margin: "0px 16px",
        position: "relative",
};


export default class JobParameters extends React.Component<IProps, {}> {
    public render() {
        const {selected} = this.props;
        if (!selected) {
            return <TitledPaper level={3} title="Select a job" />;
        }

        const job = this.props.jobs.find((searchedJob: IJob) => selected === searchedJob.general.name);
        if (!job) {
            return <TitledPaper level={3} title={`Job ${selected} not found`} />;
        }

        if (!job.arguments) {
            return <TitledPaper level={3} title={`No arguments for job ${selected}`} />;
        }

        const formPrefix = `${this.props.formBase}.parameters.${selected}`;
        const transform = this.transformArgumentToField.bind(this, formPrefix, this.props.parameters);
        const customRequiredField = (job.arguments.required || []).map(transform);
        const customOptionalField = (job.arguments.optional || []).map(transform);

        const subPrefix = `${this.props.formBase}.subcommands.${selected}`;
        const transformator = this.renderSubcommand.bind(this, subPrefix, formPrefix, this.props.parameters, this.props.subcommands);
        (job.arguments.subcommands || []).forEach((group: IJobSubcommandGroup) => {
            const rendered = transformator(group);
            if (group.optional) {
                customOptionalField.push(rendered);
            } else {
                customRequiredField.push(rendered);
            }
        });

        if (customOptionalField.length === 0 && customRequiredField.length === 0) {
            return <TitledPaper level={3} title={`No arguments for job ${selected}`} />;
        }

        const requiredFields = customRequiredField.length > 0 ? (
            <TitledPaper level={3} title="Required">
                {customRequiredField}
            </TitledPaper>
        ) : null;
        const optionalFields = customOptionalField.length > 0 ? (
            <TitledPaper level={3} title="Optional">
                {customOptionalField}
            </TitledPaper>
        ) : null;

        return <div>{requiredFields}{optionalFields}</div>;
    }

    private renderSubcommand(subPrefix: string, formPrefix: string, parameters: IStartJobParameters,
                             subcommands: IOpenbachSubcommandForm, subcommandGroup: IJobSubcommandGroup) {
        const choices = subcommandGroup.choices.map((sub: IJobSubcommand) =>
            <MenuItem key={sub.name} value={sub.name} primaryText={sub.name} />,
        );
        if (subcommandGroup.optional) {
            choices.unshift(<MenuItem key={null} value={null} primaryText="" />);
        }

        const name = subcommandGroup.group_name;
        if (!subcommands[name] || !subcommands[name].selected) {
            return (
                <div key={name} style={fieldStyle}>
                    <FormField
                        name={`${subPrefix}.${name}.selected`}
                        component={SelectFormField}
                        text={name}
                        fullWidth={true}
                        children={choices}
                    />
                </div>
            );
        }

        const selected = subcommands[name].selected;
        const subParameters = parameters[selected] as IStartJobParameters || {};
        const subArguments = subcommandGroup.choices.find((sub: IJobSubcommand) => sub.name === selected);

        const prefix = `${formPrefix}.${selected}`;
        const transform = this.transformArgumentToField.bind(this, prefix, subParameters);
        const customRequiredField = (subArguments && subArguments.required || []).map(transform);
        const customOptionalField = (subArguments && subArguments.optional || []).map(transform);

        const subGroupPrefix = `${subPrefix}.${name}.${selected}`;
        const subSubcommands = subcommands[name][selected] || {};
        const transformator = this.renderSubcommand.bind(this, subGroupPrefix, prefix, subParameters, subSubcommands);
        (subArguments && subArguments.subcommands || []).forEach((group: IJobSubcommandGroup) => {
            const rendered = transformator(group);
            if (group.optional) {
                customOptionalField.push(rendered);
            } else {
                customRequiredField.push(rendered);
            }
        });

        const requiredFields = customRequiredField.length > 0 ? (
            <TitledPaper level={3} title="Required">
                {customRequiredField}
            </TitledPaper>
        ) : null;
        const optionalFields = customOptionalField.length > 0 ? (
            <TitledPaper level={3} title="Optional">
                {customOptionalField}
            </TitledPaper>
        ) : null;

        return (
            <div key={name} style={fieldStyle}>
                <FormField
                    name={`${subPrefix}.${name}.selected`}
                    component={SelectFormField}
                    text={name}
                    fullWidth={true}
                    children={choices}
                />
                {requiredFields}
                {optionalFields}
            </div>
        );
    }

    private transformArgumentToField(formPrefix: string, parameters: IStartJobParameters, jobArgument: IJobArgument) {
        const argumentName = jobArgument.name;
        const params = parameters[argumentName] as TStartJobParameterValue[][];
        const formName = `${formPrefix}.${argumentName}`;
        return (
            <FieldArray
                key={argumentName}
                name={formName}
                component={RepeatableJobParameters}
                jobArgument={jobArgument}
                otherFunctions={this.props.otherFunctions}
                repeated={params && params.length || 0}
                formName={formName}
                style={fieldStyle}
            />
        );
    }
};


interface IProps {
    jobs: IJob[];
    otherFunctions: IOpenbachFunctionForm[];
    selected: string;
    formBase: string;
    parameters: IStartJobParameters;
    subcommands: IOpenbachSubcommandForm;
};
