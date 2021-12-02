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
};


export interface IAgentUpdateForm {
    name: string;
    agent_ip: string;
    collector_ip: string;
};


export interface IAgentState {
    assign_collector: IAgentStateEntry,
    install: IAgentStateEntry,
    retrieve_status_jobs: IAgentStateEntry,
    uninstall: IAgentStateEntry,
};


export interface IAgentStateEntry {
    last_operation_date: string,
    response: any,
    returncode: number,
};


export interface ICollector {
    address: string;
};
