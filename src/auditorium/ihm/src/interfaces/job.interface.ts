import {IAgent} from "./agent.interface";


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
};


export interface IJobArgument {
    name: string;
    count: string;
    description: string;
    type: "ip" | "int" | "str" | "float" | "None" | "job" | "scenario";
    password: boolean;
    default?: string;
    choices?: string[];
    repeatable?: boolean;
};


export interface IJobSubcommand {
    name: string;
    required: IJobArgument[];
    optional: IJobArgument[];
    subcommands?: IJobSubcommandGroup[];
};


export interface IJobSubcommandGroup {
    group_name: string;
    optional: boolean;
    choices: IJobSubcommand[];
};


export interface IJobStateQuery {
    agent: IAgent;
    operation: "install" | "uninstall";
    jobName: string;
};


export interface IJobState {
    install: IJobStateStatus,
    uninstall: IJobStateStatus,
    stat_policy: IJobStateStatus,
    log_severity: IJobStateStatus,
};


export interface IJobStateStatus {
    last_operation_date: string;
    returncode: number;
    response: any;
};


export interface IJobAgentsList {
    job_name: string;
    installed_on: {agent__name: string, agent__address: string}[];
};


export interface IExternalJobInfos {
    name: string;
    display: string;
    version: string;
};
