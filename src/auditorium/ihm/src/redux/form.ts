import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {saveScenario} from '../api/scenarios';
import type {
    IJob,
    IScenario,
    IJobSubcommandGroup,
    IStartJobParameters,
    IJobSubcommand,
    IOpenbachFunction,
    IOpenbachFunctionStartJobInstance,
    IOpenbachFunctionStartScenario,
    IOpenbachFunctionStopJobInstance,
    IOpenbachFunctionStopScenario,
    Form,
    FunctionForm,
    SubcommandForm,
    SubcommandContent,
    OpenbachFunctionType,
} from '../utils/interfaces';


interface FormState {
    [name: string]: {
        initial: IScenario;
        form: Form;
    };
}


const convertSubcommands = (groups: IJobSubcommandGroup[], parameters: IStartJobParameters): SubcommandForm => {
    const entries = groups.map((group: IJobSubcommandGroup) => {
        const {group_name, choices} = group;
        const content: SubcommandContent = {};
        const selected = (choices || []).find((sub: IJobSubcommand) => parameters.hasOwnProperty(sub.name));
        if (selected) {
            const {name, subcommands} = selected;
            const subParameters = parameters[name] as  IStartJobParameters;
            content.selected = name;
            content[name] = convertSubcommands(subcommands || [], subParameters || {});
        }

        return [group_name, content];
    });

    return Object.fromEntries(entries);
};


const convertFunction = (openbachFunction: IOpenbachFunction, jobs: IJob[]) => {
    const meta = ['id', 'label', 'wait', 'on_fail'];
    const kinds = Object.keys(openbachFunction).filter((name: string) => !meta.includes(name));
    const functionType = kinds.length === 1 ? (kinds[0] as OpenbachFunctionType) : undefined;

    const form: FunctionForm = {
        id: openbachFunction.id,
        kind: functionType,
        label: openbachFunction.label,
        on_fail: openbachFunction.on_fail,
        parameters: {},
        scenarioArguments: {},
        subcommands: {},
        wait: openbachFunction.wait,
    };

    switch (functionType) {
        case "start_job_instance":
            const startJob = openbachFunction as IOpenbachFunctionStartJobInstance;
            const {entity_name, interval, offset} = startJob.start_job_instance;
            form.entity = entity_name;
            form.interval = interval;
            form.offset = offset;
            const job = jobs.find((j: IJob) => startJob.start_job_instance.hasOwnProperty(j.general.name));
            if (job) {
                const {name} = job.general;
                form.job = name;
                const jobParameters = startJob.start_job_instance[name] as IStartJobParameters;
                form.parameters = {[name]: jobParameters};
                form.subcommands = {[name]: convertSubcommands(job.arguments.subcommands || [], jobParameters)};
            }
            break;
        case "stop_job_instances":
            const stopJob = openbachFunction as IOpenbachFunctionStopJobInstance;
            form.jobs = stopJob.stop_job_instances.openbach_function_ids;
            break;
        case "start_scenario_instance":
            const startScenario = openbachFunction as IOpenbachFunctionStartScenario;
            const {scenario_name, arguments: startArguments} = startScenario.start_scenario_instance;
            form.scenario = scenario_name;
            form.scenarioArguments = {[scenario_name]: startArguments};
            break;
        case "stop_scenario_instance":
            const stopScenario = openbachFunction as IOpenbachFunctionStopScenario;
            form.scenarioId = stopScenario.stop_scenario_instance.openbach_function_id;
            break;
        default:
            form.parameters.backup = openbachFunction;
            break;
    }

    return form;
};


const convertScenario = (scenario: IScenario, jobs: IJob[]): Form => {
    const {description, openbach_functions} = scenario;
    const args = Object.entries(scenario.arguments).map(([name, description]) => ({name, description}));
    const constants = Object.entries(scenario.constants).map(([name, value]) => ({name, value}));
    const functions = openbach_functions.map((f: IOpenbachFunction) => convertFunction(f, jobs));

    return {description, arguments: args, constants, functions};
};


const initialState: FormState = {
};


const formSlice = createSlice({
    name: "form",
    initialState,
    reducers: {
        initializeForm: (state, action: PayloadAction<{scenario: IScenario; jobs: IJob[];}>) => {
            const {scenario, jobs} = action.payload;
            if (!state.hasOwnProperty(scenario.name)) {
                return {
                    ...state,
                    [scenario.name]: {
                        form: convertScenario(scenario, jobs),
                        initial: scenario,
                    },
                };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(saveScenario.fulfilled, (state, action) => {
                const initial = action.payload;
                const {name, form} = action.meta.arg;
                return {...state, [name]: {initial, form}};
            });
    },
});


export const {initializeForm} = formSlice.actions;
export default formSlice.reducer;
