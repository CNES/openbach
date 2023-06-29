import {doFetch, asyncThunk} from './base';
import {setMessage} from '../redux/message';

import type {IJob, IExternalJobInfos, IJobAgentsList, IJobState} from '../utils/interfaces';


export const getJobs = asyncThunk<IJob[]>(
    'jobs/getJobs',
    async (_, {dispatch}) => {
        return await doFetch<IJob[]>(
            "/job",
            dispatch,
        );
    },
);


export const addJob = asyncThunk<IJob, {job: string; file: File;}>(
    'jobs/addJob',
    async ({job, file}, {dispatch}) => {
        const data = new FormData();
        data.append('name', job);
        data.append('file', file);

        const response = await doFetch<IJob>(
            "/job",
            dispatch,
            "POST",
            data,
        );
        dispatch(setMessage("Job " + job + " added into the controller"));
        return response;
    },
);


export const stateJob = asyncThunk<IJobState, {jobName: string; agent: string;}>(
    'jobs/stateJob',
    async ({jobName, agent}, {dispatch}) => {
        return await doFetch<IJobState>(
            `/job/${jobName}/state?address=${agent}`,
            dispatch,
        );
    },
);


export const listAgents = asyncThunk<IJobAgentsList, {jobName: string;}>(
    'jobs/listAgents',
    async ({jobName}, {dispatch}) => {
        return await doFetch<IJobAgentsList>(
            `/job/${jobName}/?type=agents`,
            dispatch,
        );
    },
);


export const externalJobs = asyncThunk<IExternalJobInfos[]>(
    'jobs/externalJobs',
    async (_, {dispatch}) => {
        return await doFetch<IExternalJobInfos[]>(
            "/job?external=true",
            dispatch,
        );
    },
);


export const addExternalJob = asyncThunk<IJob, {name: string;}>(
    'jobs/addExternalJob',
    async (job, {dispatch}) => {
        const response = await doFetch<IJob>(
            "/job",
            dispatch,
            "POST",
            job,
        );
        dispatch(setMessage("Job " + job.name + " installed successfully"));
        return response;
    },
);


export const internalJobs = asyncThunk<IExternalJobInfos[]>(
    'jobs/internalJobs',
    async (_, {dispatch}) => {
        return await doFetch<IExternalJobInfos[]>(
            "/job?external=true&repository=openbach",
            dispatch,
        );
    },
);


export const addInternalJob = asyncThunk<IJob, {name: string;}>(
    'jobs/addInternalJob',
    async ({name}, {dispatch}) => {
        const response = await doFetch<IJob>(
            "/job",
            dispatch,
            "POST",
            {name, repository: "openbach"},
        );
        dispatch(setMessage("Job " + name + " successfully installed"));
        return response;
    },
);


export const installOnAgents = asyncThunk<void, {jobNames: string[]; agents: string[];}>(
    'jobs/installOnAgents',
    async ({jobNames, agents}, {dispatch}) => {
        await doFetch<{}>(
            "/job",
            dispatch,
            "POST",
            {action: "install", names: jobNames, addresses: agents},
        );
    },
);


export const uninstallOnAgents = asyncThunk<void, {jobNames: string[]; agents: string[];}>(
    'jobs/uninstallOnAgents',
    async ({jobNames, agents}, {dispatch}) => {
        await doFetch<{}>(
            "/job",
            dispatch,
            "POST",
            {action: "uninstall", names: jobNames, addresses: agents},
        );
    },
);
