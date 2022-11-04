import {IAgent} from "./agent.interface";


export interface IProject {
    name: string;
    description: string;
    entity: IEntity[];
    network: INetwork[];
    hidden_network: string[];
    scenario: IScenario[];
    owners: string[];
    reserved_agents?: string[];
};


export interface IEntity {
    name: string;
    description: string;
    agent?: IAgent;
    networks?: INetwork[];
};


export interface INetwork {
    name: string;
    address: string;
    interface?: string;
    ip?: string;
};


export interface IScenario {
    name: string;
    description: string;
    arguments: Map<string, string>;
    constants: Map<string, string>;
    openbach_functions: IOpenbachFunction[];
};


export interface IOpenbachFunction {
    id: number;
    label: string;
    on_fail: IOpenbachFunctionFailPolicy;
    wait: IOpenbachFunctionWait;
};


export interface IOpenbachFunctionWait {
    time: number;
    running_ids: number[];
    ended_ids: number[];
    launched_ids: number[];
    finished_ids: number[];
};


export interface IOpenbachFunctionFailPolicy {
    policy: string;
    delay?: number;
    retry?: number;
};


export interface IOpenbachFunctionStartJobInstance extends IOpenbachFunction {
    start_job_instance: IStartJobInstance;
};


export interface IOpenbachFunctionStopJobInstance extends IOpenbachFunction {
    stop_job_instances: IStopJobInstance;
};


export interface IOpenbachFunctionStartScenario extends IOpenbachFunction {
    start_scenario_instance: IStartScenarioInstance;
};


export interface IOpenbachFunctionStopScenario extends IOpenbachFunction {
    stop_scenario_instance: IStopScenarioInstance;
};


export interface IOpenbachFunctionWhile extends IOpenbachFunction {
    while: IWhile;
};


export interface IOpenbachFunctionIf extends IOpenbachFunction {
    if: IIf;
};


export interface IStartScenarioInstance {
    scenario_name: string;
    arguments: {[argumentName: string]: string};
};


export interface IStopScenarioInstance {
    openbach_function_id: number;
};


export interface IStopJobInstance {
    openbach_function_ids: number[];
};


export interface IStartJobInstance {
    entity_name: string;
    offset?: number;
    interval?: number;
    // If we want to use "index signature" and keep
    // entity_name and offset out of the way, we must
    // declare the return type of the index as a
    // superset of the types returned by other properties
    [name: string]: string | number | IStartJobParameters;
};


export interface IStartJobParameters {
    [parameterName: string]: TStartJobParameterValue[][] | IStartJobParameters;
};


export type TStartJobParameterValue = string | number | boolean;


export interface IWhile {
    condition: TOpenbachFunctionCondition;
    openbach_functions_while: number[];
    openbach_functions_end: number[];
};


export interface IIf {
    condition: TOpenbachFunctionCondition;
    openbach_functions_true: number[];
    openbach_functions_false: number[];
};


export type TOpenbachFunctionCondition = ITwoOperandsCondition | ITwoConditionsCondition | IOneConditionCondition;
export type TOpenbachFunctionOperand = IDatabaseCondition | IValueCondition | IStatisticCondition;


export interface IDatabaseCondition {
    type: "database";
    name: string;
    key: string;
    attribute: string;
};


export interface IValueCondition {
    type: "value";
    value: string;
};


export interface IStatisticCondition {
    type: "statistic";
    measurement: string;
    field: string;
};


export interface ITwoOperandsCondition {
    type: "=" | "==" | "<=" | "<" | ">=" | ">" | "!=";
    left_operand: TOpenbachFunctionOperand;
    right_operand: TOpenbachFunctionOperand;
};


export interface ITwoConditionsCondition {
    type: "and" | "or" | "xor";
    left_condition: TOpenbachFunctionCondition;
    right_condition: TOpenbachFunctionCondition;
};


export interface IOneConditionCondition {
    type: "not";
    condition: TOpenbachFunctionCondition;
};


export type TOpenbachFunctions = "start_job_instance" | "stop_job_instances" | "start_scenario_instance" | "stop_scenario_instance" | "while" | "if";
export const OpenbachFunctionsList: TOpenbachFunctions[] = [
    "start_job_instance",
    "stop_job_instances",
    "start_scenario_instance",
    "stop_scenario_instance",
    "while",
    "if",
];
