import moment from 'moment';

import {
    IScenarioInstance,
    IOpenbachFunctionInstance,
    IOpenbachFunctionInstanceStartJobInstance,
    IOpenbachFunctionInstanceStartScenarioInstance,
    IOpenbachFunctionInstanceStopJobInstances,
    IOpenbachFunctionInstanceStopScenarioInstance,
} from './interfaces';


const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";


export const isStartJobInstance = (instance: IOpenbachFunctionInstance): instance is IOpenbachFunctionInstanceStartJobInstance => {
    return instance.hasOwnProperty("start_job_instance");
};


export const isStartScenarioInstance = (instance: IOpenbachFunctionInstance): instance is IOpenbachFunctionInstanceStartScenarioInstance => {
    return instance.hasOwnProperty("start_scenario_instance");
};


export const isStopJobInstances = (instance: IOpenbachFunctionInstance): instance is IOpenbachFunctionInstanceStopJobInstances => {
    return instance.hasOwnProperty("stop_job_instances");
};


export const isStopScenarioInstance = (instance: IOpenbachFunctionInstance): instance is IOpenbachFunctionInstanceStopScenarioInstance => {
    return instance.hasOwnProperty("stop_scenario_instance");
};


const openbachFunctionKnownKeys: {[Property in keyof IOpenbachFunctionInstance]: null;} = {
    id: null,
    label: null,
    launch_date: null,
    status: null,
    wait: null,
};


export const extractOpenbachFunctionName = (openbachFunction: IOpenbachFunctionInstance): string | undefined => {
    for (const name in openbachFunction) {
        if (openbachFunction.hasOwnProperty(name) && !openbachFunctionKnownKeys.hasOwnProperty(name)) {
            return name;
        }
    }
};


const extractTime = (amount: number): string => {
    const value = amount % 60;
    return value > 9 ? String(value) : "0" + value;
};


export const formatScenarioDuration = ({scenario_instance_id, start_date, stop_date}: IScenarioInstance): string => {
    const startDate = moment(start_date);
    const started = startDate.format(DATE_FORMAT);
    const header = `(scenario instance id: ${scenario_instance_id})`;
    if (!stop_date) {
        return `${header} Ongoing [started ${started}]`;
    }

    const stopDate = moment(stop_date);
    const stopped = stopDate.format(DATE_FORMAT);
    const seconds = extractTime(stopDate.diff(startDate, "seconds"));
    const minutes = extractTime(stopDate.diff(startDate, "minutes"));
    const hours = stopDate.diff(startDate, "hours");
    return `${header} ${started} --> ${stopped} [Duration of ${hours}:${minutes}:${seconds}]`;
};


export const idToLabel = (id: number, functions: {id: number; label?: string;}[]): string => {
    const found = functions.find((f: {id: number;}) => f.id === id);
    return found?.label || String(id);
};
