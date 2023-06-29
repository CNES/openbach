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


/*
const storeDeepParameter = (parameters: IStartJobParameters, names: string[], values: TStartJobParameterValue[][]): IStartJobParameters => {
    const [name, ...rest] = names;
    if (rest.length) {
        const current = parameters[name] as IStartJobParameters;
        const inner = storeDeepParameter(current || {}, rest, values);
        return {...parameters, [name]: inner};
    }
    return {...parameters, [name]: values};
};


const storeDeepSubcommand = (subcommands: SubcommandForm, names: string[], selected?: string): SubcommandForm => {
    const [name, ...rest] = names;
    const group = subcommands[name] || {};
    if (rest.length) {
        if (!group.selected) {
            return {};
        }
        const current = group[group.selected] as SubcommandForm;
        const inner = storeDeepSubcommand(current || {}, rest, selected);
        return {...subcommands, [name]: {...group, [group.selected]: inner}};
    }
    return {...subcommands, [name]: {...group, selected}}
};


interface ChangeScenario {
    name: string;
}


interface ChangeItem extends ChangeScenario {
    index: number;
}


interface ChangeDescription extends ChangeScenario {
    description: string;
}


interface ChangeArgument extends ChangeItem {
    argument: string;
    description: string;
}


interface ChangeConstant extends ChangeItem {
    constant: string;
    value: string;
}


interface ChangeFunction extends ChangeItem {
    id: number;
    label?: string;
    kind?: OpenbachFunctionType;
}


interface ChangeEntity extends ChangeItem {
    job?: string;
    entity?: string;
    offset?: number;
    interval?: number;
}


interface ChangeParameter extends ChangeItem {
    job: string;
    parameters: string[];
    values: TStartJobParameterValue[][];
}


interface ChangeSubcommand extends ChangeItem {
    job: string;
    groups: string[];
    selected?: string;
}


interface ChangeStartedScenario extends ChangeItem {
    scenario: string;
}


interface ChangeStartedScenarioArgument extends ChangeStartedScenario {
    argument: string;
    value: string;
}


interface ChangeStoppedScenario extends ChangeItem {
    scenarioId?: number;
}


interface ChangeStoppedJobs extends ChangeItem {
    jobs: number[];
}
*/


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
        /*
        changeDescription: (state, action: PayloadAction<ChangeDescription>) => {
            const {name, description} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const form = {...scenarioForm.form, description};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        addArgument: (state, action: PayloadAction<ChangeScenario>) => {
            const {name} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const args = [...scenarioForm.form.arguments, {name: "", description: ""}];
                const form = {...scenarioForm.form, arguments: args};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        deleteArgument: (state, action: PayloadAction<ChangeItem>) => {
            const {name, index} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const args = scenarioForm.form.arguments.filter((_, i: number) => i !== index);
                const form = {...scenarioForm.form, arguments: args};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeArgument: (state, action: PayloadAction<ChangeArgument>) => {
            const {name, index, argument, description} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const args = scenarioForm.form.arguments.map((arg, i: number) => (
                    i === index ? {name: argument, description} : arg
                ));
                const form = {...scenarioForm.form, arguments: args};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        addConstant: (state, action: PayloadAction<ChangeScenario>) => {
            const {name} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const constants = [...scenarioForm.form.constants, {name: "", value: ""}];
                const form = {...scenarioForm.form, constants};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        deleteConstant: (state, action: PayloadAction<ChangeItem>) => {
            const {name, index} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const constants = scenarioForm.form.constants.filter((_, i: number) => i !== index);
                const form = {...scenarioForm.form, constants};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeConstant: (state, action: PayloadAction<ChangeConstant>) => {
            const {name, index, constant, value} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const constants = scenarioForm.form.constants.map((arg, i: number) => (
                    i === index ? {name: constant, value} : arg
                ));
                const form = {...scenarioForm.form, constants};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        addOpenbachFunction: (state, action: PayloadAction<ChangeScenario>) => {
            const {name} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const id = parseInt("xxxxxxxx".replace(/[x]/g, (c) => {
                    const r = (Math.random() * 16) | 0;
                    const v = c === "x" ? r : ((r & 0x3) | 0x8);
                    return v.toString(16);
                }), 16);
                const functions = [...scenarioForm.form.functions, {id, parameters: {}}];
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        deleteOpenbachFunction: (state, action: PayloadAction<ChangeItem>) => {
            const {name, index} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.filter((_, i: number) => i !== index);
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunction: (state, action: PayloadAction<ChangeFunction>) => {
            const {name, index, id, label, kind} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => (
                    i === index ? {...arg, id, label, kind} : arg
                ));
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionWait: (state, action: PayloadAction<ChangeItem & IOpenbachFunctionWait>) => {
            const {name, index, ...wait} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => (
                    i === index ? {...arg, wait} : arg
                ));
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionFail: (state, action: PayloadAction<ChangeItem & IOpenbachFunctionFailPolicy>) => {
            const {name, index, ...on_fail} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => (
                    i === index ? {...arg, on_fail} : arg
                ));
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionEntity: (state, action: PayloadAction<ChangeEntity>) => {
            const {name, index, entity, job, offset, interval} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => (
                    i === index ? {...arg, entity, job, offset, interval} : arg
                ));
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionParameter: (state, action: PayloadAction<ChangeParameter>) => {
            const {name, index, job, parameters: names, values} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => {
                    if (i !== index) {
                        return arg;
                    }

                    const {parameters: p} = arg;
                    const params = (p && (p as JobParameters)[job]) || {};
                    const changed = storeDeepParameter(params, names, values);
                    const parameters = p ? {...p, [job]: changed} : {[job]: changed};
                    return {...arg, parameters};
                });
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionSubcommand: (state, action: PayloadAction<ChangeSubcommand>) => {
            const {name, index, job, groups, selected} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => {
                    if (i !== index) {
                        return arg;
                    }

                    const {subcommands: s} = arg;
                    const subs = (s && s[job]) || {};
                    const changed = storeDeepSubcommand(subs, groups, selected);
                    const subcommands = s ? {...s, [job]: changed} : {[job]: changed};
                    return {...arg, subcommands};
                });
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionScenario: (state, action: PayloadAction<ChangeStartedScenario>) => {
            const {name, index, scenario} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => {
                    if (i !== index) {
                        return arg;
                    }

                    const {scenarioArguments: sa} = arg;
                    const args = (sa && sa[scenario]) || {};
                    const scenarioArguments = sa ? {...sa, [scenario]: args} : {[scenario]: args};
                    return {...arg, scenario, scenarioArguments};
                });
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionScenarioArgument: (state, action: PayloadAction<ChangeStartedScenarioArgument>) => {
            const {name, index, scenario, argument, value} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => {
                    if (i !== index) {
                        return arg;
                    }

                    const {scenarioArguments: sa} = arg;
                    const args = (sa && sa[scenario]) || {};
                    const changed = {...args, [argument]: value};
                    const scenarioArguments = sa ? {...sa, [scenario]: changed} : {[scenario]: changed};
                    return {...arg, scenarioArguments};
                });
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionScenarioId: (state, action: PayloadAction<ChangeStoppedScenario>) => {
            const {name, index, scenarioId} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => (
                    i === index ? {...arg, scenarioId} : arg
                ));
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        changeOpenbachFunctionJobs: (state, action: PayloadAction<ChangeStoppedJobs>) => {
            const {name, index, jobs} = action.payload;
            const scenarioForm = state[name];
            if (scenarioForm) {
                const functions = scenarioForm.form.functions.map((arg, i: number) => (
                    i === index ? {...arg, jobs} : arg
                ));
                const form = {...scenarioForm.form, functions};
                return {...state, [name]: {...scenarioForm, form}};
            }
        },
        */
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


export const {
    initializeForm,
    /*
    changeDescription,
    addArgument,
    deleteArgument,
    changeArgument,
    addConstant,
    deleteConstant,
    changeConstant,
    addOpenbachFunction,
    deleteOpenbachFunction,
    changeOpenbachFunction,
    changeOpenbachFunctionFail,
    changeOpenbachFunctionWait,
    changeOpenbachFunctionEntity,
    changeOpenbachFunctionParameter,
    changeOpenbachFunctionSubcommand,
    changeOpenbachFunctionScenario,
    changeOpenbachFunctionScenarioArgument,
    changeOpenbachFunctionScenarioId,
    changeOpenbachFunctionJobs,
    */
} = formSlice.actions;
export default formSlice.reducer;
