import {IExternalJobInfos, IJob, IJobAgentsList, IJobState} from "../interfaces/job.interface";
import {doApiCall, doApiMultipartCall} from "./common";


export function get(): Promise<IJob[]> {
    return doApiCall("/job")
        .then((response: Response) => response.json<IJob[]>());
};


export function addJob(jobName: string, jobFile: File): Promise<IJob> {
    return doApiMultipartCall("/job", {file: jobFile, name: jobName})
        .then((response: Response) => response.json<IJob>());
};


export function stateJob(jobName: string, agent: string): Promise<IJobState> {
    return doApiCall(`/job/${jobName}/state?address=${agent}`)
        .then((response: Response) => response.json<IJobState>());
};


export function listAgents(jobName: string): Promise<IJobAgentsList> {
    return doApiCall(`/job/${jobName}/?type=agents`)
        .then((response: Response) => response.json<IJobAgentsList>());
};


export function getExternalJobs(): Promise<IExternalJobInfos[]> {
    return doApiCall("/job?external=true")
        .then((response: Response) => response.json<IExternalJobInfos[]>());
};


export function addExternalJob(jobName: string): Promise<IJob> {
    return doApiCall("/job", "POST", {name: jobName})
        .then((response: Response) => response.json<IJob>());
};


export function getInternalJobs(): Promise<IExternalJobInfos[]> {
    return doApiCall("/job?external=true&repository=openbach")
        .then((response: Response) => response.json<IExternalJobInfos[]>());
};


export function addInternalJob(jobName: string): Promise<IJob> {
    return doApiCall("/job", "POST", {name: jobName, repository: "openbach"})
        .then((response: Response) => response.json<IJob>());
};


export function installOnAgents(jobName: string, addresses: string[]): Promise<{}> {
    return doApiCall("/job", "POST", {action: "install", names: [jobName], addresses})
        .then((response) => response.json());
};


export function uninstallOnAgents(jobName: string, addresses: string[]): Promise<{}> {
    return doApiCall("/job", "POST", {action: "uninstall", names: [jobName], addresses})
        .then((response) => response.json());
};
