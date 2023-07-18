import {doFetch, asyncThunk} from './base';
import {setMessage} from '../redux/message';

import type {
    ICredentials, IFilesCount,
    IScenario, IScenarioInstance,
    IStartJobParameters,
    TStartJobParameterValue,
    IOpenbachFunction,
    IOpenbachFunctionStartJobInstance,
    IOpenbachFunctionStopJobInstance,
    IOpenbachFunctionStartScenario,
    IOpenbachFunctionStopScenario,
    Form, FunctionForm,
    JobParameters,
    SubcommandForm,
    OpenbachFunctionBackup,
} from '../utils/interfaces';


interface ScenarioId {
    project: string;
    scenario: string;
}


interface ScenarioRun extends ScenarioId {
    args: object;
}


interface ScenarioFavorite extends ScenarioId {
    favorite: boolean;
}


export const deleteScenario = asyncThunk<void, ScenarioId>(
    'scenarios/deleteScenario',
    async ({project, scenario}, {dispatch}) => {
        await doFetch<{}>(
            "/openbach/project/" + project + "/scenario/" + scenario,
            dispatch,
            "DELETE",
        );
        dispatch(setMessage("Scenario " + scenario + " removed successfully"));
    },
);


export const addScenario = asyncThunk<IScenario, ScenarioId>(
    'scenarios/addScenario',
    async ({project, scenario}, {dispatch}) => {
        const body: IScenario = {
            arguments: {},
            constants: {},
            description: "",
            name: scenario,
            openbach_functions: [],
        };
        const response = await doFetch<IScenario>(
            "/openbach/project/" + project + "/scenario",
            dispatch,
            "POST",
            body,
        );
        dispatch(setMessage("Scenario " + scenario + " added successfully"));
        return response;
    },
);


export const importScenario = asyncThunk<IScenario, {project: string; scenario: File;}>(
    'scenarios/importScenario',
    async ({project, scenario}, {dispatch}) => {
        const response = await doFetch<IScenario>(
            "/openbach/project/" + project + "/scenario",
            dispatch,
            "POST",
            scenario,
        );
        dispatch(setMessage("Scenario added successfully"));
        return response;
    },
);


export const updateScenario = asyncThunk<IScenario, {project: string; scenario: IScenario;}>(
    'scenarios/updateScenario',
    async ({project, scenario}, {dispatch}) => {
        const response = await doFetch<IScenario>(
            "/openbach/project/" + project + "/scenario/" + scenario.name,
            dispatch,
            "PUT",
            scenario,
        );
        dispatch(setMessage("Scenario saved"));
        return response;
    },
);


export const saveScenario = asyncThunk<IScenario, {project: string; name: string; form: Form;}>(
    'scenarios/saveScenario',
    async ({project, name, form}, {dispatch}) => {
        const scenario: IScenario = {
            name,
            description: form.description,
            arguments: Object.fromEntries(form.arguments.map(
                ({name, description}) => [name, description]
            )),
            constants: Object.fromEntries(form.constants.map(
                ({name, value}) => [name, value]
            )),
            openbach_functions: form.functions.map((func: FunctionForm) => {
                const {id, kind, label, on_fail, wait} = func;
                const obf: Partial<IOpenbachFunction> = {
                    id, label: label || undefined,
                    wait: wait && {...wait, time: coerce(wait.time)},
                    on_fail: on_fail && {...on_fail, delay: coerce(on_fail.delay), retry: coerce(on_fail.retry)},
                };
                switch (kind) {
                    case "start_job_instance":
                        if (func.job) {
                            const formParameters = (func.parameters as JobParameters)[func.job] || {};
                            const formSubcommands = (func.subcommands && func.subcommands[func.job]) || {};
                            const jobParameters = convertStartJobInstanceParameters(formParameters, formSubcommands);
                            (obf as IOpenbachFunctionStartJobInstance).start_job_instance = {
                                entity_name: (func.entity || undefined) as string,
                                interval: coerceDate(func.interval),
                                offset: coerceDate(func.offset),
                                [func.job]: jobParameters,
                            };
                        }
                        break;
                    case "stop_job_instances":
                        const {jobs: openbach_function_ids} = func;
                        if (openbach_function_ids) {
                            (obf as IOpenbachFunctionStopJobInstance).stop_job_instances = {openbach_function_ids};
                        }
                        break;
                    case "start_scenario_instance":
                        const scenario_name = func.scenario;
                        if (scenario_name) {
                            (obf as IOpenbachFunctionStartScenario).start_scenario_instance = {
                                scenario_name,
                                arguments: (func.scenarioArguments && func.scenarioArguments[scenario_name]) || {},
                            };
                        }
                        break;
                    case "stop_scenario_instance":
                        const {scenarioId: openbach_function_id} = func;
                        if (openbach_function_id) {
                            (obf as IOpenbachFunctionStopScenario).stop_scenario_instance = {openbach_function_id};
                        }
                        break;
                    default:
                        return (func.parameters as OpenbachFunctionBackup).backup;
                }
                return obf as IOpenbachFunction;
            }),
        };
        const response = await doFetch<IScenario>(
            "/openbach/project/" + project + "/scenario/" + name,
            dispatch,
            "PUT",
            scenario,
        );
        dispatch(setMessage("Scenario saved"));
        return response;
    },
);


export const favoriteScenario = asyncThunk<ICredentials, ScenarioFavorite>(
    'scenarios/favoriteScenario',
    async ({project, scenario, favorite}, {dispatch}) => {
        dispatch(setMessage("Saving your preferences..."));
        const response = await doFetch<ICredentials>(
            "/openbach/project/" + project + "/scenario/" + scenario,
            dispatch,
            "POST",
            {action: "favorite", favorite},
        );
        dispatch(setMessage(favorite
            ? "Scenario marked as favorite"
            : "Scenario is no longer a favorite"));
        return response;
    },
);


export const launchScenario = asyncThunk<IScenarioInstance, ScenarioRun>(
    'scenarios/launchScenario',
    async ({project, scenario, args}, {dispatch}) => {
        const response = await doFetch<IScenarioInstance>(
            "/openbach/project/" + project + "/scenario/" + scenario + "/scenario_instance",
            dispatch,
            "POST",
            {arguments: args},
        );
        dispatch(setMessage("Scenario started"));
        return response;
    },
);


export const getScenariosInstances = asyncThunk<IScenarioInstance[], {project: string;}>(
    'scenarios/getScenariosInstances',
    async ({project}, {getState, dispatch}) => {
        const offset = getState().project.scenarioInstances.length;
        return await doFetch<IScenarioInstance[]>(
            "/openbach/project/" + project + "/scenario_instance?quiet&offset=" + offset + "&limit=15",
            dispatch,
        );
    },
);


export const getScenarioInstances = asyncThunk<IScenarioInstance[], ScenarioId>(
    'scenarios/getScenarioInstances',
    async ({project, scenario}, {getState, dispatch}) => {
        const offset = getState().project.currentScenarioInstances.length;
        return await doFetch<IScenarioInstance[]>(
            "/openbach/project/" + project + "/scenario/" + scenario + "/scenario_instance?quiet&offset=" + offset + "&limit=15",
            dispatch,
        );
    },
);


export const getScenarioInstance = asyncThunk<IScenarioInstance, {instance: number; verbose: boolean;}>(
    'scenarios/getScenarioInstance',
    async ({instance, verbose}, {dispatch}) => {
        return await doFetch<IScenarioInstance>(
            "/openbach/scenario_instance/" + instance + (verbose ? "" : "?quiet"),
            dispatch,
        );
    },
);


export const stopScenarioInstance = asyncThunk<void, {instance: number;}>(
    'scenarios/stopScenarioInstance',
    async ({instance}, {dispatch}) => {
        await doFetch<{}>(
            "/openbach/scenario_instance/" + instance,
            dispatch,
            "POST",
            {},
        );
        dispatch(setMessage("Scenario stopped"));
    },
);


export const deleteScenarioInstance = asyncThunk<void, {instance: number;}>(
    'scenarios/deleteScenarioInstance',
    async ({instance}, {dispatch}) => {
        await doFetch<{}>(
            "/openbach/scenario_instance/" + instance,
            dispatch,
            "DELETE",
            {},
        );
    },
);


export const getScenarioInstanceFilesCount = asyncThunk<IFilesCount, {instance: number;}>(
    'scenarios/getScenarioInstanceFilesCount',
    async ({instance}, {dispatch}) => {
        return await doFetch<IFilesCount>(
            "/openbach/scenario_instance/" + instance + "?files_count",
            dispatch,
        );
    },
);


const coerce = (value?: string | number): number | string | undefined => {
    const valueAsNumber = Number(value);
    if (valueAsNumber === 0) {
        return 0;
    } else {
        return valueAsNumber || value || undefined;
    }
};


const coerceDate = (value?: string | number): number | undefined => {
    const coerced = coerce(value);
    if (coerced !== 0 || String(value) === "0") {
        return coerced as number | undefined;
    }
};


function convertStartJobInstanceParameters(parameters: IStartJobParameters, subcommands: SubcommandForm): IStartJobParameters {
    const jobParameters: IStartJobParameters = {};
    Object.entries(parameters).forEach(([param, value]) => {
        if (value && Array.isArray(value)) {
            const filtered = value.map((occurrence) => {
                for (let i = occurrence.length; i >= 0; --i) {
                    if (occurrence[i] || occurrence[i] === 0) {
                        return occurrence.slice(0, i + 1);
                    }
                }
                return undefined;
            }).filter(Boolean);
            if (filtered.length) {
                jobParameters[param] = filtered as TStartJobParameterValue[][];
            }
        }
    });
    Object.values(subcommands).forEach((subcommand) => {
        const selected = subcommand && subcommand.selected;
        if (selected) {
            const subgroups = (subcommand && subcommand[selected] as SubcommandForm) || {};
            const params = parameters[selected] as IStartJobParameters || {};
            jobParameters[selected] = convertStartJobInstanceParameters(params, subgroups);
        }
    });
    return jobParameters;
};
