import {IAgent} from "./agent.interface";
import {IOpenbachFunctionWait, IStartJobInstance, IStartScenarioInstance, IStopJobInstance, IStopScenarioInstance} from "./project.interface";


export type TScenarioInstanceStatus = "Scheduling" | "Running" | "Finished Ok" | "Finished Ko" | "Stopped" | "Agents Unreachable";
export type TOpenbachFunctionInstanceStatus = "Scheduled" | "Running" | "Finished" | "Stopped" | "Error" | "Retried";
export type TJobInstanceStatus = "Not Scheduled" | "Scheduled" | "Running" | "Not Running" | "Error" | "Stopped" | "Agent Unreachable";


export interface IScenarioInstanceState {
    all: IScenarioInstance[];
    current: IScenarioInstance[];
    more: boolean;
    moreCurrent: boolean;
    startError?: IStartScenarioError;
    currentScenario?: string;
};


export interface IScenarioInstance {
    arguments: Array<{name: string, value: string}>;
    openbach_functions: IOpenbachFunctionInstance[];
    owner_scenario_instance_id: number;
    project_name: string;
    scenario_instance_id: number;
    scenario_name: string;
    status: TScenarioInstanceStatus;
    start_date: string;
    stop_date: string;
    sub_scenario_instance_ids: number[];
};


export interface IOpenbachFunctionInstance {
    id: number;
    label: string;
    status: TOpenbachFunctionInstanceStatus;
    launch_date: Date;
    wait: IOpenbachFunctionWait;
};


export interface IJobInstance {
    id: number;
    name: string;
    agent: string;
    entity: string;
    status: TJobInstanceStatus;
    start_date: string;
    stop_date: string;
};


export interface IOpenbachFunctionInstanceStartJobInstance extends IOpenbachFunctionInstance {
    job: IJobInstance;
    start_job_instance: IStartJobInstance;
};


export function isStartJobInstance(instance: IOpenbachFunctionInstance): instance is IOpenbachFunctionInstanceStartJobInstance {
    return instance.hasOwnProperty("start_job_instance");
};


export interface IOpenbachFunctionInstanceStartScenarioInstance extends IOpenbachFunctionInstance {
    scenario: IScenarioInstance;
    start_scenario_instance: IStartScenarioInstance;
};


export function isStartScenarioInstance(instance: IOpenbachFunctionInstance): instance is IOpenbachFunctionInstanceStartScenarioInstance {
    return instance.hasOwnProperty("start_scenario_instance");
};


export interface IOpenbachFunctionInstanceStopJobInstances extends IOpenbachFunctionInstance {
    stop_job_instances: IStopJobInstance;
};


export function isStopJobInstances(instance: IOpenbachFunctionInstance): instance is IOpenbachFunctionInstanceStopJobInstances {
    return instance.hasOwnProperty("stop_job_instances");
};


export interface IOpenbachFunctionInstanceStopScenarioInstance extends IOpenbachFunctionInstance {
    stop_scenario_instance: IStopScenarioInstance;
};


export function isStopScenarioInstance(instance: IOpenbachFunctionInstance): instance is IOpenbachFunctionInstanceStopScenarioInstance {
    return instance.hasOwnProperty("stop_scenario_instance");
};


const openbachFunctionKnownKeys: IOpenbachFunctionInstance = {
    id: null,
    label: null,
    launch_date: null,
    status: null,
    wait: null,
};
export function extractOpenbachFunctionName(openbachFunction: IOpenbachFunctionInstance): string {
    for (const name in openbachFunction) {
        if (openbachFunction.hasOwnProperty(name) && !openbachFunctionKnownKeys.hasOwnProperty(name)) {
            return name;
        }
    }
};


export interface IFilesCount {
    [jobName: string]: {[statName: string]: number};
};


export interface IMissingJobAgent {
    agent: IAgent;
    jobs: string[];
};

export interface IMissingJobEntities {
    [entityName: string]: IMissingJobAgent;
};


export interface IStartScenarioError {
    error: string;
    entities: IMissingJobEntities;
};
