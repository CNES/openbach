import * as React from "react";
import {connect} from "react-redux";

import IconButton from "material-ui/IconButton";
import {ListItem} from "material-ui/List";
import Paper from "material-ui/Paper";

import {IJob} from "../../../interfaces/job.interface";
import {
    IProject,
    IScenario,
    TOpenbachFunctionCondition,
    TOpenbachFunctionOperand,
    TOpenbachFunctions,
} from "../../../interfaces/project.interface";
import {IOpenbachFunctionForm} from "../../../interfaces/scenarioForm.interface";
import {DeleteIcon} from "../../../utils/theme";
import {idToLabel} from "../../../utils/utils";

import TitledPaper from "../../common/TitledPaper";
import OpenbachFunctionCondition from "./OpenbachFunctionCondition";
import OpenbachFunctionHeader from "./OpenbachFunctionHeader";
import OpenbachFunctionStartJobInstance from "./OpenbachFunctionStartJobInstance";
import OpenbachFunctionStartScenarioInstance from "./OpenbachFunctionStartScenarioInstance";
import OpenbachFunctionStopJobInstance from "./OpenbachFunctionStopJobInstance";
import OpenbachFunctionStopScenarioInstance from "./OpenbachFunctionStopScenarioInstance";
import ScenarioDivider from "./ScenarioDivider";


class OpenbachFunction extends React.Component<IProps & IStoreProps, IState> {
    private static getFormValues(reduxForm, formName: string) {
        let form = reduxForm;
        formName.split(".").forEach((part: string) => { if (form) { form = form[part]; } });
        if (form) {
          return form.values;
        }
    }

    constructor(props) {
        super(props);

        const {formIndex, formName, reduxForm} = this.props;
        const openbachFunctions: IOpenbachFunctionForm[] = OpenbachFunction.getFormValues(reduxForm, formName).functions;
        this.state = { selectedOpenbachFunction: openbachFunctions[formIndex].kind };

        this.removeOurself = this.removeOurself.bind(this);
    }

    public render() {
        const {formIndex, formName, reduxForm} = this.props;
        const openbachFunctions: IOpenbachFunctionForm[] = OpenbachFunction.getFormValues(reduxForm, formName).functions;
        const currentFunction = openbachFunctions[formIndex];
        const otherFunctions = openbachFunctions.filter(
            (openbachFunction: IOpenbachFunctionForm) =>
                openbachFunction.label && openbachFunction.label !== currentFunction.label,
        );
        const openbachFunctionReferences = otherFunctions.map((openbachFunction: IOpenbachFunctionForm) => (
            { value: openbachFunction.id, label: openbachFunction.label }
        ));

        const innerComponent = (
            <Paper zDepth={1} style={{paddingBottom: "15px"}}>
                <OpenbachFunctionHeader
                    failPolicy={currentFunction ? currentFunction.on_fail ? currentFunction.on_fail.policy : undefined : undefined}
                    index={formIndex}
                    ids={openbachFunctionReferences}
                />
                <ScenarioDivider />
                {this.openbachFunctionRenderer(currentFunction, otherFunctions)}
            </Paper>
        );

        const deleteButton = (
            <IconButton
                touch={true}
                tooltip="Delete this OpenBACH function"
                tooltipPosition="top-right"
                onTouchTap={this.removeOurself}
                style={{padding: "0px"}}
            >
                <DeleteIcon />
            </IconButton>
        );

        const label = currentFunction.label ? `[${currentFunction.label}] ` : "";
        const primary = label + this.mainLabel(currentFunction, openbachFunctions);
        return (
            <ListItem
                primaryText={primary}
                secondaryText={this.dependenciesLabel(currentFunction, openbachFunctions)}
                leftIcon={deleteButton}
                nestedItems={[<ListItem key="inner" disabled={true}>{innerComponent}</ListItem>]}
                primaryTogglesNestedList={true}
            />
        );
    }

    public componentWillReceiveProps(nextProps: IStoreProps) {
        const {formIndex, formName} = this.props;
        if (nextProps.reduxForm) {
            const formValues = OpenbachFunction.getFormValues(nextProps.reduxForm, formName);
            if (formValues) {
                this.setState({ selectedOpenbachFunction: formValues.functions[formIndex].kind });
            }
        }
    }

    private removeOurself(event) {
        event.stopPropagation();
        this.props.remove();
    }

    private openbachFunctionRenderer(currentFunction: IOpenbachFunctionForm, otherFunctions: IOpenbachFunctionForm[]) {
        const { reduxForm, formName, formIndex } = this.props;
        switch (this.state.selectedOpenbachFunction) {
            case "start_job_instance":
                return (
                    <OpenbachFunctionStartJobInstance
                        index={formIndex}
                        openbachFunction={currentFunction}
                        otherFunctions={otherFunctions}
                    />
                );

            case "start_scenario_instance":
                const formValues = OpenbachFunction.getFormValues(reduxForm, formName);
                const scenarioName = formValues.name;
                const otherScenarios = this.props.project.scenario.filter(
                    (otherScenario: IScenario) => otherScenario.name !== scenarioName,
                );

                const launchedScenarioName = formValues.functions[formIndex].scenario;
                const launchedScenario = otherScenarios.find(
                    (scenario: IScenario) => scenario.name === launchedScenarioName,
                );

                return (
                    <OpenbachFunctionStartScenarioInstance
                        index={formIndex}
                        scenarioList={otherScenarios}
                        launchedScenario={launchedScenario}
                    />
                );

            case "stop_scenario_instance":
                return (
                    <OpenbachFunctionStopScenarioInstance
                        index={formIndex}
                        otherFunctions={otherFunctions}
                    />
                );

            case "stop_job_instances":
                return (
                    <OpenbachFunctionStopJobInstance
                        index={formIndex}
                        otherFunctions={otherFunctions}
                    />
                );

            case "while":
                return (
                    <OpenbachFunctionCondition
                        index={formIndex}
                        openbachFunction={currentFunction}
                        otherFunctions={otherFunctions}
                        textFalse="Execute as soon as condition is false"
                        textTrue="Execute while condition is true"
                        title="While"
                    />
                );

            case "if":
                return (
                    <OpenbachFunctionCondition
                        index={formIndex}
                        openbachFunction={currentFunction}
                        otherFunctions={otherFunctions}
                        textFalse="Execute if condition is false"
                        textTrue="Execute if condition is true"
                        title="If"
                    />
                );

            case undefined:
                return <TitledPaper level={3} title="Unknown Openbach Function" />;

            default:
                return <TitledPaper level={3} title={this.state.selectedOpenbachFunction} />;
        }
    }

    private mainLabel(current: IOpenbachFunctionForm, functions: IOpenbachFunctionForm[]): string {
        switch (this.state.selectedOpenbachFunction) {
            case undefined:
                return "Not selected yet";
            case "start_job_instance":
                const jobName = current.job ? current.job : "no job configured";
                const entityName = current.entity ? current.entity : "unknown entity";
                return `Start Job Instance: ${jobName} on ${entityName}`;
            case "stop_job_instances":
                const hasJobs = current.jobs && current.jobs.length;
                const ending = hasJobs ? (current.jobs.length > 1 ? "s: " : ": ") : "";
                const jobs = (current.jobs || []).map((id: number) => idToLabel(id, functions)).join(", ");
                return `Stop Job Instance${ending}${jobs}`;
            case "start_scenario_instance":
                const scenarioName = current.scenario ? current.scenario : "no scenario configured";
                return `Start Scenario Instance: ${scenarioName}`;
            case "stop_scenario_instance":
                const scenarioID = current.scenarioID ? idToLabel(current.scenarioID, functions) : "no scenario configured";
                return `Stop Scenario Instance: ${scenarioID}`;
            case "while":
                return `While (${parseCondition(current.condition)})`;
            case "if":
                return `If (${parseCondition(current.condition)})`;
            default:
                return `Uneditable OpenBach Function: ${this.state.selectedOpenbachFunction}`;
        }
    }

    private dependenciesLabel(current: IOpenbachFunctionForm, functions: IOpenbachFunctionForm[]): string {
        const waitConditions = current.wait;
        if (!waitConditions) {
            return "Started immediately";
        }

        const time = waitConditions.time ? `${waitConditions.time} seconds` : "immediately";
        const schedules = [
            this.dependencyString("running", waitConditions.running_ids, functions),
            this.dependencyString("ended", waitConditions.ended_ids, functions),
            this.dependencyString("started", waitConditions.launched_ids, functions),
            this.dependencyString("finished", waitConditions.finished_ids, functions),
        ].filter((s: string) => Boolean(s));

        if (!schedules.length) {
            return `Started ${time} in`;
        } else {
            if (schedules.length > 1) {
                schedules[schedules.length - 1] = "and " + schedules[schedules.length - 1];
            }
            return "Started " + time + " after " + schedules.join(schedules.length > 2 ? ", " : " ");
        }
    }

    private dependencyString(ending: string, waited_ids: number[], functions: IOpenbachFunctionForm[]) {
        if (!waited_ids) {
            return "";
        }

        const waited = waited_ids.map((id: number) => idToLabel(id, functions));
        const pluralize = waited.length > 1 ? "are" : "is";
        const joined = waited.join(", ");
        return `${joined} ${pluralize} ${ending}`;
    }
};


const parseCondition = (condition: TOpenbachFunctionCondition): string => {
    if (!condition) {
        return "???";
    }

    switch (condition.type) {
        case "=":
        case "==":
        case ">=":
        case ">":
        case "<=":
        case "<":
        case "!=":
            return `${parseOperand(condition.left_operand)} ${condition.type} ${parseOperand(condition.right_operand)}`;
        case "not":
            return `${condition.type} ${parseCondition(condition.condition)}`;
        case "and":
        case "or":
        case "xor":
            return `${parseCondition(condition.left_condition)} ${condition.type} ${parseCondition(condition.right_condition)}`;
        default:
            return "???";
    }
};


const parseOperand = (operand: TOpenbachFunctionOperand): string => {
    if (!operand) {
        return "???";
    }

    switch (operand.type) {
        case "database":
            return `${operand.name}[${operand.attribute}](${operand.key})`;
        case "value":
            return operand.value;
        case "statistic":
            return `${operand.measurement}[${operand.field}]`;
        default:
            return "???";
    }
};


interface IState {
    selectedOpenbachFunction: TOpenbachFunctions;
};


interface IProps {
    formName: string;
    formIndex: number;
    remove: () => void;
};


interface IStoreProps {
    project: IProject;
    reduxForm: any;
};


const mapStoreToProps = (store): IStoreProps => ({
    project: store.project.current,
    reduxForm: store.form,
});


export default connect<IStoreProps, {}, IProps>(mapStoreToProps)(OpenbachFunction);
