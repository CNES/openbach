import * as React from "react";
import {connect} from "react-redux";

import {getJobs} from "../../../actions/job";
import {updateScenario} from "../../../actions/scenario";
import {IJob, IJobSubcommand, IJobSubcommandGroup} from "../../../interfaces/job.interface";
import {
    IOpenbachFunction,
    IOpenbachFunctionIf,
    IOpenbachFunctionStartJobInstance,
    IOpenbachFunctionStartScenario,
    IOpenbachFunctionStopJobInstance,
    IOpenbachFunctionStopScenario,
    IOpenbachFunctionWhile,
    IScenario,
    IStartJobParameters,
    TOpenbachFunctions,
} from "../../../interfaces/project.interface";
import {IOpenbachArgumentForm, IOpenbachConstantForm, IOpenbachFunctionForm, IOpenbachSubcommandForm, IScenarioForm} from "../../../interfaces/scenarioForm.interface";

import ScenarioForm from "./ScenarioForm";


class ScenarioBuilder extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    private static convertSubcommands(groups: IJobSubcommandGroup[], parameters: IStartJobParameters): IOpenbachSubcommandForm {
        const subGroups: IOpenbachSubcommandForm = {};
        groups.forEach((group: IJobSubcommandGroup) => {
            const groupName = group.group_name;
            subGroups[groupName] = {selected: undefined};
            const selectedSubgroup = (group.choices || []).find((subcommand: IJobSubcommand) => parameters.hasOwnProperty(subcommand.name));
            if (selectedSubgroup) {
                subGroups[groupName].selected = selectedSubgroup.name;
                subGroups[groupName][selectedSubgroup.name] = ScenarioBuilder.convertSubcommands(
                    selectedSubgroup.subcommands || [],
                    parameters[selectedSubgroup.name] as IStartJobParameters || {});
            }
        });
        return subGroups;
    }

    private static convertFunction(func: IOpenbachFunction, jobs: IJob[]): IOpenbachFunctionForm {
        const meta = ["id", "label", "wait", "on_fail"];
        const kinds = Object.keys(func).filter((name: string) => !meta.includes(name));
        const functionType = kinds.length === 1 ? (kinds[0] as TOpenbachFunctions) : null;

        const functionForm: IOpenbachFunctionForm = {
            id: func.id,
            kind: functionType,
            label: func.label,
            on_fail: func.on_fail,
            parameters: {},
            scenarioArguments: {},
            subcommands: {},
            wait: func.wait,
        };

        switch (functionType) {
            case "start_job_instance":
                const startJob = (func as IOpenbachFunctionStartJobInstance).start_job_instance;
                functionForm.entity = startJob.entity_name;
                functionForm.interval = startJob.interval;
                functionForm.offset = startJob.offset;
                const job: IJob = jobs.find((jobToFind: IJob) => startJob.hasOwnProperty(jobToFind.general.name));
                if (job) {
                    const name: string = job.general.name;
                    functionForm.job = name;
                    const jobParameters = startJob[name] as IStartJobParameters;
                    functionForm.parameters = { [name]: jobParameters };
                    functionForm.subcommands = { [name]: ScenarioBuilder.convertSubcommands(job.arguments.subcommands || [], jobParameters) };
                }
                break;
            case "stop_job_instances":
                const stopJobFunc = func as IOpenbachFunctionStopJobInstance;
                functionForm.jobs = stopJobFunc.stop_job_instances.openbach_function_ids;
                break;
            case "start_scenario_instance":
                const startScenario = (func as IOpenbachFunctionStartScenario).start_scenario_instance;
                const scenarioName = startScenario.scenario_name;
                functionForm.scenario = scenarioName;
                functionForm.scenarioArguments = { [scenarioName]: startScenario.arguments };
                break;
            case "stop_scenario_instance":
                const stopScenarioFunc = func as IOpenbachFunctionStopScenario;
                functionForm.scenarioID = stopScenarioFunc.stop_scenario_instance.openbach_function_id;
                break;
            case "while":
                const whileFunc = func as IOpenbachFunctionWhile;
                functionForm.condition = whileFunc.while.condition;
                functionForm.conditionTrue = whileFunc.while.openbach_functions_while;
                functionForm.conditionFalse = whileFunc.while.openbach_functions_end;
                break;
            case "if":
                const ifFunc = func as IOpenbachFunctionIf;
                functionForm.condition = ifFunc.if.condition;
                functionForm.conditionTrue = ifFunc.if.openbach_functions_true;
                functionForm.conditionFalse = ifFunc.if.openbach_functions_false;
                break;
            default:
                functionForm.parameters = { backup: func };
                break;
        }
        return functionForm;
    }

    private static convertArguments(args: Map<string, string>): IOpenbachArgumentForm[] {
        const parameters = [];
        for (const key in args) {
            if (args.hasOwnProperty(key)) {
                parameters.push({ name: key, description: args[key] });
            }
        }
        return parameters;
    }

    private static convertConstants(consts: Map<string, string>): IOpenbachConstantForm[] {
        const constants = [];
        for (const key in consts) {
            if (consts.hasOwnProperty(key)) {
                constants.push({ name: key, value: consts[key] });
            }
        }
        return constants;
    }

    private static convertScenario(scenario: IScenario, jobs: IJob[]): IScenarioForm {
        return {
            arguments: ScenarioBuilder.convertArguments(scenario.arguments),
            constants: ScenarioBuilder.convertConstants(scenario.constants),
            description: scenario.description,
            functions: scenario.openbach_functions.map((f: IOpenbachFunction) => ScenarioBuilder.convertFunction(f, jobs)),
            name: scenario.name,
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            scenario: ScenarioBuilder.convertScenario(props.scenario, props.jobs || []),
        };
        this.doSaveScenario = this.doSaveScenario.bind(this);
    }

    public render() {
        const {loaded, scenario} = this.state;

        if (!loaded) {
            return <div><p>Loading job list</p></div>;
        }

        return (
            <ScenarioForm
                scenario={scenario}
                initialValues={scenario}
                onSubmit={this.doSaveScenario}
                form={`scenario_${scenario.name}`}
            />
        );
    }

    public componentWillMount() {
        this.props.loadJobs();
    }

    public componentWillReceiveProps(nextProps: IProps & IStoreProps & IDispatchProps) {
        const {jobs, scenario} = nextProps;

        if (jobs !== this.props.jobs) {
            this.setState({ loaded: true, scenario: ScenarioBuilder.convertScenario(scenario, jobs) });
        } else if (scenario !== this.props.scenario) {
            this.setState({ scenario: ScenarioBuilder.convertScenario(scenario, jobs) });
        }
    }

    private doSaveScenario() {
        this.props.saveScenario(this.props.scenario.name);
    }
};


interface IState {
    loaded: boolean;
    scenario: IScenarioForm;
};


interface IProps {
    scenario: IScenario;
};


interface IStoreProps {
    jobs: IJob[];
};


const mapStoreToProps = (store): IStoreProps => ({
    jobs: store.job,
});


interface IDispatchProps {
    loadJobs: () => void;
    saveScenario: (scenario: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    loadJobs: () => dispatch(getJobs()),
    saveScenario: (scenario: string) => dispatch(updateScenario(scenario)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(ScenarioBuilder);
