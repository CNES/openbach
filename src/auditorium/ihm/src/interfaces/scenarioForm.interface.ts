import {IOpenbachFunction, IOpenbachFunctionWait, IOpenbachFunctionFailPolicy, TOpenbachFunctions, TOpenbachFunctionCondition, IStartJobParameters} from "./project.interface";


export interface IScenarioForm {
    name: string;
    description: string;
    arguments: IOpenbachArgumentForm[];
    constants: IOpenbachConstantForm[];
    functions: IOpenbachFunctionForm[];
};


export interface IOpenbachFunctionForm {
    id: number;
    label: string;
    kind: TOpenbachFunctions;
    wait: IOpenbachFunctionWait;
    on_fail: IOpenbachFunctionFailPolicy;
    entity?: string;
    offset?: number;
    interval?: number;
    job?: string;
    jobs?: number[];
    scenario?: string;
    scenarioID?: number;
    scenarioArguments?: IOpenbachScenarioParametersForm;
    condition?: TOpenbachFunctionCondition;
    conditionTrue?: number[];
    conditionFalse?: number[];
    parameters: IUnsupportedOpenbachFunctionBackup | IOpenbachJobParametersForm;
    subcommands?: IOpenbachJobSubcommandForm;
};


export interface IUnsupportedOpenbachFunctionBackup {
    backup: IOpenbachFunction;
};


export interface IOpenbachJobParametersForm {
    [jobName: string]: IStartJobParameters;
};


export interface IOpenbachScenarioParametersForm {
    [scenarioName: string]: {[argumentName: string]: string;};
};


export interface IOpenbachArgumentForm {
    name: string;
    description: string;
};


export interface IOpenbachConstantForm {
    name: string;
    value: string;
};


export interface IOpenbachJobSubcommandForm {
    [jobName: string]: IOpenbachSubcommandForm;
};


export interface IOpenbachSubcommandForm {
    [groupName: string]: IOpenbachSubcommandContentForm;
};


export interface IOpenbachSubcommandContentForm {
    selected: string;
    [groupValue: string]: string | IOpenbachSubcommandForm;
};
