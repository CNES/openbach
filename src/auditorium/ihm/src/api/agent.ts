import {IAgent, IAgentState, IAgentUpdateForm, ICollector} from "../interfaces/agent.interface";
import {doApiCall} from "./common";


export function add(agent: IAgent, reattach: boolean): Promise<IAgent> {
    return doApiCall(reattach ? "/agent?reattach" : "/agent", "POST", agent)
        .then(() => new Promise<IAgent>((resolve) => resolve(agent)));
};


export function remove(address: string, detach: boolean): Promise<IAgent> {
    const url = "/agent/" + address;
    return doApiCall(detach ? url + "?detach_only" : url, "DELETE")
        .then(() => new Promise<IAgent>((resolve) => ({})));
};


export function update(address: string, agent: IAgentUpdateForm): Promise<IAgent> {
    return doApiCall("/agent/" + address, "PUT", agent)
        .then((response: Response) => response.json<IAgent>());
};


export function status(address: string): Promise<IAgentState> {
    return doApiCall("/agent/" + address + "/state")
        .then((response: Response) => response.json<IAgentState>());
};


export function get(services: boolean = false): Promise<IAgent[]> {
    return doApiCall("/agent" + (services ? "?services" : ""))
        .then((response: Response) => response.json<IAgent[]>());
};


export function getCollectors(): Promise<ICollector[]> {
    return doApiCall("/collector")
        .then((response) => response.json());
};


export function getJobs(address: string): Promise<string[]> {
    return doApiCall("/job?address=" + address)
        .then((response) => response.json())
        .then((response: any) => response.installed_jobs.map((job: any) => job.name))
        .catch((ex) => new Promise((_, reject) => reject("An error occured " + ex)));
};


export function installJobs(address: string, jobs: string[]): Promise<{}> {
    return doApiCall("/job", "POST", {action: "install", addresses: [address], names: jobs})
        .then((response) => response.json());
};


export function uninstallJobs(address: string, jobs: string[]): Promise<{}> {
    return doApiCall("/job", "POST", {action: "uninstall", addresses: [address], names: jobs})
        .then((response) => response.json());
};


export function reserveProject(address: string, projectName?: string): Promise<IAgent> {
    const project = projectName ? projectName : null;
    return doApiCall("/agent/" + address, "POST", {action: "reserve_project", project})
        .then((response) => response.json());
};
