import {RegisteredFieldState} from "redux-form";

import {getProject} from "../api/project";
import {
    addScenario,
    deleteScenario,
    deleteScenarioInstance as deleteOneInstance,
    favoriteScenario as doFavoriteScenario,
    getFilteredScenarioInstancesFromProject as getCurrentFromProject,
    getScenarioInstanceFromID,
    getScenarioInstancesFromProject as getAllFromProject,
    importScenario,
    launchScenario,
    updateScenario as putScenario,
} from "../api/scenario";
import {
    IOpenbachFunction,
    IOpenbachFunctionStartJobInstance,
    IOpenbachFunctionStartScenario,
    IOpenbachFunctionStopJobInstance,
    IOpenbachFunctionStopScenario,
    IScenario,
    IStartJobParameters,
} from "../interfaces/project.interface";
import {
    IOpenbachArgumentForm,
    IOpenbachConstantForm,
    IOpenbachFunctionForm,
    IOpenbachSubcommandForm,
    IScenarioForm,
    IUnsupportedOpenbachFunctionBackup,
} from "../interfaces/scenarioForm.interface";
import {IScenarioInstance} from "../interfaces/scenarioInstance.interface";
import {
    ADD_SCENARIO_ERROR,
    ADD_SCENARIO_PENDING,
    ADD_SCENARIO_SUCCESS,
    DELETE_SCENARIO_INSTANCES_ERROR,
    DELETE_SCENARIO_INSTANCES_PENDING,
    DELETE_SCENARIO_INSTANCES_SUCCESS,
    GET_FILTERED_SCENARIO_INSTANCES_ERROR,
    GET_FILTERED_SCENARIO_INSTANCES_PENDING,
    GET_FILTERED_SCENARIO_INSTANCES_SUCCESS,
    GET_LOGIN_CREDENTIALS_ERROR,
    GET_LOGIN_CREDENTIALS_PENDING,
    GET_LOGIN_CREDENTIALS_SUCCESS,
    GET_PROJECT_ERROR,
    GET_PROJECT_PENDING,
    GET_PROJECT_SUCCESS,
    GET_SCENARIO_INSTANCE_ERROR,
    GET_SCENARIO_INSTANCE_PENDING,
    GET_SCENARIO_INSTANCE_SUCCESS,
    GET_SCENARIO_INSTANCES_ERROR,
    GET_SCENARIO_INSTANCES_PENDING,
    GET_SCENARIO_INSTANCES_SUCCESS,
    PUT_SCENARIO_INSTANCE_ERROR,
    PUT_SCENARIO_INSTANCE_PENDING,
    PUT_SCENARIO_INSTANCE_SUCCESS,
    REMOVE_SCENARIO_ERROR,
    REMOVE_SCENARIO_PENDING,
    REMOVE_SCENARIO_SUCCESS,
    SET_SNACKMESSAGE,
    START_SCENARIO_INSTANCE_ERROR,
    START_SCENARIO_INSTANCE_PENDING,
    START_SCENARIO_INSTANCE_SUCCESS,
    UPDATE_SCENARIO_ERROR,
    UPDATE_SCENARIO_PENDING,
    UPDATE_SCENARIO_SUCCESS,
} from "../utils/constants";


export function newScenario(name: string) {
    return (dispatch, getState) => {
        const project: string = getState().project.current.name;
        return dispatch({
            payload: {
                promise: addScenario(project, name),
            },
            types: [
                ADD_SCENARIO_PENDING,
                ADD_SCENARIO_SUCCESS,
                ADD_SCENARIO_ERROR,
            ],
        });
    };
};


export function newImportedScenario(scenario: File) {
    return (dispatch, getState) => {
        const project: string = getState().project.current.name;
        return dispatch({
            payload: {
                promise: importScenario(project, scenario),
            },
            types: [
                ADD_SCENARIO_PENDING,
                ADD_SCENARIO_SUCCESS,
                ADD_SCENARIO_ERROR,
            ],
        });
    };
};


export function removeScenario(name: string) {
    return (dispatch, getState) => {
        const project: string = getState().project.current.name;
        return dispatch({
            payload: {
                promise: deleteScenario(project, name),
            },
            types: [
                REMOVE_SCENARIO_PENDING,
                REMOVE_SCENARIO_SUCCESS,
                REMOVE_SCENARIO_ERROR,
            ],
        });
    };
};


export function updateScenario(scenarioName: string) {
    return (dispatch, getState) => {
        const project: string = getState().project.current.name;
        const scenarioForm = getState().form;
        const key = "scenario_" + scenarioName;
        if (scenarioForm.hasOwnProperty(key) && scenarioForm[key].anyTouched) {
            const scenario: IScenario = convertFormToScenario(scenarioForm[key].values);
            return dispatch({
                payload: {
                    promise: putScenario(project, scenario),
                },
                types: [
                    UPDATE_SCENARIO_PENDING,
                    UPDATE_SCENARIO_SUCCESS,
                    UPDATE_SCENARIO_ERROR,
                ],
            });
        }
    };
};


export function favoriteScenario(scenarioName: string, favorite: boolean) {
    return (dispatch, getState) => {
        const project: string = getState().project.current.name;
        return dispatch({
            payload: {
                promise: doFavoriteScenario(project, scenarioName, favorite).then((res) => {
                        const content = favorite ? "Scenario marked as favorite" : "Scenario is no longer a favorite";
                        dispatch({
                            message: {content, date: new Date()},
                            type: SET_SNACKMESSAGE,
                        });
                        return res;
                    }),
            },
            types: [
                GET_LOGIN_CREDENTIALS_PENDING,
                GET_LOGIN_CREDENTIALS_SUCCESS,
                GET_LOGIN_CREDENTIALS_ERROR,
            ],
        });
    };
};


function convertFormToScenario(form: IScenarioForm): IScenario {
    const argumentsForm = new Map<string, string>();
    form.arguments.forEach((arg: IOpenbachArgumentForm) => {
        argumentsForm[arg.name] = arg.description;
    });

    const constantsForm = new Map<string, string>();
    form.constants.forEach((constant: IOpenbachConstantForm) => {
        constantsForm[constant.name] = constant.value;
    });

    const scenario: IScenario = {
        arguments: argumentsForm,
        constants: constantsForm,
        description: form.description,
        name: form.name,
        openbach_functions: form.functions.map((func: IOpenbachFunctionForm) => {
            const {id, kind, label, on_fail, wait} = func;
            if (wait) {
                const timeNumber = Number(wait.time);
                wait.time = timeNumber === 0 ? 0 : (timeNumber || wait.time || undefined);
            }
            if (on_fail) {
                const retryLimit = Number(on_fail.retry);
                on_fail.retry = retryLimit === 0 ? 0 : (retryLimit || on_fail.retry || undefined);
                const retryDelay = Number(on_fail.delay);
                on_fail.delay = retryDelay === 0 ? 0 : (retryDelay || on_fail.delay || undefined);
            }
            switch (kind) {
                case "start_job_instance":
                    const formParameters = func.parameters[func.job] || {};
                    const formSubcommands = func.subcommands && func.subcommands[func.job] || {};
                    const jobParameters = convertStartJobInstanceParameters(formParameters, formSubcommands);
                    const intervalNumber = Number(func.interval);
                    const offsetNumber = Number(func.offset);
                    return {
                        id, label, on_fail, wait,
                        start_job_instance: {
                            entity_name: func.entity,
                            interval: isNaN(intervalNumber) || (intervalNumber === 0 && (func.interval as any) !== "0") ? undefined : intervalNumber,
                            offset: isNaN(offsetNumber) || (offsetNumber === 0 && (func.offset as any) !== "0") ? undefined : offsetNumber,
                            [func.job]: jobParameters,
                        },
                    };
                case "stop_job_instances":
                    return {
                        id, label, on_fail, wait,
                        stop_job_instances: {openbach_function_ids: func.jobs},
                    };
                case "start_scenario_instance":
                    const scenario_name = func.scenario;
                    const scenarioArguments = func.scenarioArguments && func.scenarioArguments[scenario_name] || {};

                    return {
                        id, label, on_fail, wait,
                        start_scenario_instance: {scenario_name, arguments: scenarioArguments},
                    };
                case "stop_scenario_instance":
                    return {
                        id, label, on_fail, wait,
                        stop_scenario_instance: {openbach_function_id: func.scenarioID},
                    };
                case "while":
                    return {
                        id, label, on_fail, wait,
                        while: {
                            condition: func.condition,
                            openbach_functions_end: func.conditionFalse,
                            openbach_functions_while: func.conditionTrue,
                        },
                    };
                case "if":
                    return {
                        id, label, on_fail, wait,
                        if: {
                            condition: func.condition,
                            openbach_functions_false: func.conditionFalse,
                            openbach_functions_true: func.conditionTrue,
                        },
                    };
                default:
                    return (func.parameters as IUnsupportedOpenbachFunctionBackup).backup;
            }
        }),
    };
    return scenario;
};


function convertStartJobInstanceParameters(parameters: IStartJobParameters, subcommands: IOpenbachSubcommandForm): IStartJobParameters {
    const jobParameters: IStartJobParameters = {};
    for (const param in parameters) {
        if (parameters.hasOwnProperty(param)) {
            const value = parameters[param];
            if (value && Array.isArray(value)) {
                const filtered = value.map((occurrence) => {
                    for (let i = occurrence.length; i >= 0; --i) {
                        if (occurrence[i] || occurrence[i] === 0) {
                            return occurrence.slice(0, i + 1);
                        }
                    }
                }).filter(Boolean);
                if (filtered.length) {
                    jobParameters[param] = filtered;
                }
            }
        }
    }
    for (const group in subcommands) {
        if (subcommands.hasOwnProperty(group)) {
            const subcommand = subcommands[group];
            const selected = subcommand && subcommand.selected;
            if (selected) {
                const subgroups = subcommand && subcommand[selected] as IOpenbachSubcommandForm || {};
                const params = parameters[selected] as IStartJobParameters || {};
                jobParameters[selected] = convertStartJobInstanceParameters(params, subgroups);
            }
        }
    }
    return jobParameters;
};


export function getScenarioInstancesFromProject(project: string) {
    return (dispatch, getState) => {
        const offset: number = getState().scenario.all.length;
        return dispatch({
            payload: {
                promise: getAllFromProject(project, offset),
            },
            types: [
                GET_SCENARIO_INSTANCES_PENDING,
                GET_SCENARIO_INSTANCES_SUCCESS,
                GET_SCENARIO_INSTANCES_ERROR,
            ],
        });
    };
};


export function getFilteredScenarioInstancesFromProject(project: string, scenarioName: string) {
    return (dispatch, getState) => {
        const offset: number = getState().scenario.current.length;
        return dispatch({
            payload: {
                promise: getCurrentFromProject(project, scenarioName, offset),
            },
            types: [
                GET_FILTERED_SCENARIO_INSTANCES_PENDING,
                GET_FILTERED_SCENARIO_INSTANCES_SUCCESS,
                GET_FILTERED_SCENARIO_INSTANCES_ERROR,
            ],
        });
    };
};


export function startScenarioInstance(scenario: string, date: Date, args: any) {
    return (dispatch, getState) => {
        const project: string = getState().project.current.name;
        return dispatch({
            payload: {
                promise: launchScenario(project, scenario, date, args)
                    .then((response) => {
                        return dispatch({
                            payload: {
                                promise: getScenarioInstanceFromID(response.scenario_instance_id, false),
                            },
                            types: [
                                PUT_SCENARIO_INSTANCE_PENDING,
                                PUT_SCENARIO_INSTANCE_SUCCESS,
                                PUT_SCENARIO_INSTANCE_ERROR,
                            ],
                        });
                    }),
            },
            types: [
                START_SCENARIO_INSTANCE_PENDING,
                START_SCENARIO_INSTANCE_SUCCESS,
                START_SCENARIO_INSTANCE_ERROR,
            ],
        });
    };
};


export function statusScenarioInstance(instanceID: number, verbose: boolean) {
    return (dispatch) => {
        return dispatch({
            payload: {
                promise: getScenarioInstanceFromID(instanceID, verbose),
            },
            types: [
                GET_SCENARIO_INSTANCE_PENDING,
                GET_SCENARIO_INSTANCE_SUCCESS,
                GET_SCENARIO_INSTANCE_ERROR,
            ],
        });
    };
};


export function deleteScenarioInstance(scenarioInstance: IScenarioInstance) {
    return (dispatch) => {
        return dispatch({
            payload: {
                promise: deleteOneInstance(scenarioInstance),
            },
            types: [
                DELETE_SCENARIO_INSTANCES_PENDING,
                DELETE_SCENARIO_INSTANCES_SUCCESS,
                DELETE_SCENARIO_INSTANCES_ERROR,
            ],
        });
    };
};
