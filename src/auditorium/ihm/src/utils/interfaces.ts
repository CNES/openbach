export interface ICredentials {
    username: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    is_user: boolean;
    is_admin: boolean;
    favorites: {[project: string]: string[]};
}


export interface ILog {
    id: string;
    timestamp: number;
    severity: string;
    source: string;
    message: string;
    checked: boolean;
}


export interface IProfilePermissions {
    login: string;
    active: boolean;
    admin: boolean;
}


export interface IAgent {
    // unique key
    address: string;
    name: string;
    collector_ip: string;
    reserved?: string;
    username?: string;
    password?: string;
    status?: string;
    reachable?: boolean;
    available?: boolean;
    project?: string;
    errors?: {msg: string}[];
    services?: {[serviceName: string]: string};
}


export type ICollector = Pick<IAgent, "address">;


export interface IAgentState {
    assign_collector: IAgentStateEntry,
    install: IAgentStateEntry,
    retrieve_status_jobs: IAgentStateEntry,
    uninstall: IAgentStateEntry,
}


export interface IAgentStateEntry {
    last_operation_date: string,
    response: any,
    returncode: number,
}


export interface IJob {
    general: {
        name: string;
        description: string;
        keywords: string[];
        job_version: string;
    };
    arguments: {
        required: IJobArgument[];
        optional: IJobArgument[];
        subcommands?: IJobSubcommandGroup[];
    };
}


export interface IJobArgument {
    name: string;
    count: string;
    description: string;
    type: "ip" | "int" | "str" | "float" | "None" | "job" | "scenario";
    password: boolean;
    default?: string;
    choices?: string[];
    repeatable?: boolean;
}


export interface IJobSubcommand {
    name: string;
    required: IJobArgument[];
    optional: IJobArgument[];
    subcommands?: IJobSubcommandGroup[];
}


export interface IJobSubcommandGroup {
    group_name: string;
    optional: boolean;
    choices: IJobSubcommand[];
}


export interface IExternalJobInfos {
    name: string;
    display: string;
    version: string;
}


export interface IJobAgentsList {
    job_name: string;
    installed_on: {agent__name: string, agent__address: string}[];
}


export interface IJobState {
    install: IJobStateStatus,
    uninstall: IJobStateStatus,
    stat_policy: IJobStateStatus,
    log_severity: IJobStateStatus,
}


export interface IJobStateStatus {
    last_operation_date: string;
    returncode: number;
    response: any;
}


export interface IProject {
    name: string;
    description: string;
    entity: IEntity[];
    network: INetwork[];
    hidden_network: string[];
    scenario: IScenario[];
    owners: string[];
    reserved_agents?: string[];
}


export interface IEntity {
    name: string;
    description: string;
    agent?: IAgent;
    networks?: INetwork[];
}


export interface INetwork {
    name: string;
    address: string;
    interface?: string;
    ip?: string;
}


export interface IScenario {
    name: string;
    description: string;
    arguments: {[name: string]: string;};
    constants: {[name: string]: string;};
    openbach_functions: IOpenbachFunction[];
}


export interface IOpenbachFunction {
    id: number;
    label: string;
    on_fail: IOpenbachFunctionFailPolicy;
    wait: IOpenbachFunctionWait;
}


export interface IOpenbachFunctionWait {
    time?: number | string;
    running_ids: number[];
    ended_ids: number[];
    launched_ids: number[];
    finished_ids: number[];
}


export interface IOpenbachFunctionFailPolicy {
    policy: string;
    delay?: number | string;
    retry?: number | string;
}


export interface IOpenbachFunctionStartJobInstance extends IOpenbachFunction {
    start_job_instance: IStartJobInstance;
}


export interface IOpenbachFunctionStopJobInstance extends IOpenbachFunction {
    stop_job_instances: IStopJobInstance;
}


export interface IOpenbachFunctionStartScenario extends IOpenbachFunction {
    start_scenario_instance: IStartScenarioInstance;
}


export interface IOpenbachFunctionStopScenario extends IOpenbachFunction {
    stop_scenario_instance: IStopScenarioInstance;
}


export interface IStartScenarioInstance {
    scenario_name: string;
    arguments: {[argumentName: string]: string};
}


export interface IStopScenarioInstance {
    openbach_function_id: number;
}


export interface IStopJobInstance {
    openbach_function_ids: number[];
}


export interface IStartJobInstance {
    entity_name: string;
    offset?: number;
    interval?: number;
    // If we want to use "index signature" and keep
    // entity_name and offset out of the way, we must
    // declare the return type of the index as a
    // superset of the types returned by other properties
    [name: string]: string | number | undefined | IStartJobParameters;
}


export interface IStartJobParameters {
    [parameterName: string]: TStartJobParameterValue[][] | IStartJobParameters;
}


export type TStartJobParameterValue = number[] | string | number | boolean;


export type TOpenbachFunction = "start_job_instance" | "start_scenario_instance" | "openbach_function" | "argument";
export type TOpenbachFunctionInstanceStatus = "Scheduled" | "Running" | "Finished" | "Stopped" | "Error" | "Retried";
export type TJobInstanceStatus = "Not Scheduled" | "Scheduled" | "Running" | "Not Running" | "Error" | "Stopped" | "Agent Unreachable";
export type TScenarioInstanceStatus = "Scheduling" | "Running" | "Finished Ok" | "Finished Ko" | "Stopped" | "Agents Unreachable";


export interface IScenarioInstance {
    arguments: {name: string; value: string;}[];
    openbach_functions: IOpenbachFunctionInstance[];
    owner_scenario_instance_id: number;
    project_name: string;
    scenario_instance_id: number;
    scenario_name: string;
    status: TScenarioInstanceStatus;
    start_date: string;
    stop_date: string;
    sub_scenario_instance_ids: number[];
}


export interface IOpenbachFunctionInstance {
    id: number;
    label: string;
    status: TOpenbachFunctionInstanceStatus;
    launch_date: Date;
    wait: IOpenbachFunctionWait;
}


export interface IJobInstance {
    id: number;
    name: string;
    agent: string;
    entity: string;
    status: TJobInstanceStatus;
    start_date: string;
    stop_date: string;
}


export interface IOpenbachFunctionInstanceStartJobInstance extends IOpenbachFunctionInstance {
    job: IJobInstance;
    start_job_instance: IStartJobInstance;
}


export interface IOpenbachFunctionInstanceStartScenarioInstance extends IOpenbachFunctionInstance {
    scenario: IScenarioInstance;
    start_scenario_instance: IStartScenarioInstance;
}


export interface IOpenbachFunctionInstanceStopJobInstances extends IOpenbachFunctionInstance {
    stop_job_instances: IStopJobInstance;
}


export interface IOpenbachFunctionInstanceStopScenarioInstance extends IOpenbachFunctionInstance {
    stop_scenario_instance: IStopScenarioInstance;
}


export interface IFilesCount {
    [jobName: string]: {[statName: string]: number};
}


export interface IChronografStatistic {
    jobAgent: string;
    jobName: string;
    jobId: number;
    statName: string;
    unit: string;
}


export interface Form {
    description: string;
    arguments: ArgumentForm[];
    constants: ConstantForm[];
    functions: FunctionForm[];
}


export interface ArgumentForm {
    name: string;
    description: string;
}


export interface ConstantForm {
    name: string;
    value: string;
}


export interface FunctionForm {
    id: number;
    label?: string;
    kind?: OpenbachFunctionType;
    wait?: IOpenbachFunctionWait;
    on_fail?: IOpenbachFunctionFailPolicy;
    entity?: string;
    offset?: number;
    interval?: number;
    job?: string;
    jobs?: number[];
    scenario?: string;
    scenarioId?: number;
    scenarioArguments?: ScenarioParameters;
    parameters: OpenbachFunctionBackup | JobParameters;
    subcommands?: JobSubcommandForm;
}


interface ScenarioParameters {
    [scenarioName: string]: {[argumentName: string]: string;};
}


export interface JobParameters {
    [jobName: string]: IStartJobParameters;
}


export interface OpenbachFunctionBackup {
    backup: IOpenbachFunction;
}


interface JobSubcommandForm {
    [jobName: string]: SubcommandForm;
}


export interface SubcommandForm {
    [groupName: string]: SubcommandContent;
}


export interface SubcommandContent {
    selected?: string;
    [groupValue: string]: string | SubcommandForm | undefined;
}


export const OpenbachFunctionsList = [
    "start_job_instance",
    "stop_job_instances",
    "start_scenario_instance",
    "stop_scenario_instance",
] as const;
export declare type OpenbachFunctionType = typeof OpenbachFunctionsList[number];
