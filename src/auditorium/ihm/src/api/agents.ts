import {doFetch, asyncThunk} from './base';
import {setMessage} from '../redux/message';

import type {IAgent, IAgentState, ICollector} from '../utils/interfaces';


interface AgentUpdateForm {
    name: string;
    agent_ip: string;
    collector_ip: string;
}


interface BaseAgentAddForm {
    username: string;
    name: string;
    address: string;
    collector_ip: string;
    http_proxy?: string;
    https_proxy?: string;
}


interface AgentAddPasswordForm extends BaseAgentAddForm {
    password: string;
}


interface AgentAddKeysForm extends BaseAgentAddForm {
    private_key: File;
    public_key: File;
}


interface InstalledJobs {
    agent: string;
    installed_jobs: {name: string;}[];
}


export interface NewAgent {
    agent: AgentAddPasswordForm | AgentAddKeysForm;
    reattach: boolean;
}


export const getAgents = asyncThunk<IAgent[], {services: boolean;}>(
    'agents/getAgents',
    async ({services}, {dispatch}) => {
        return await doFetch<IAgent[]> (
            "/agent" + (services ? "?services" : ""),
            dispatch,
        );
    },
);


export const addAgent = asyncThunk<IAgent, NewAgent>(
    'agents/addAgent',
    async ({agent, reattach}, {dispatch}) => {
        const hasPassword = (agent as AgentAddPasswordForm).password !== undefined;
        const data = new FormData();
        if (!hasPassword) {
            for (const property in agent) {
                if (agent.hasOwnProperty(property)) {
                    data.append(property, Reflect.get(agent, property));
                }
            }
        }

        await doFetch<{}> (
            "/agent" + (reattach ?  "?reattach" : ""),
            dispatch,
            "POST",
            hasPassword ? agent : data,
        );
        dispatch(setMessage("Agent successfully added"));
        return agent;
    },
);


export const removeAgent = asyncThunk<void, {address: string; detach: boolean;}>(
    'agents/removeAgent',
    async ({address, detach}, {dispatch}) => {
        await doFetch<{}> (
            "/agent/" + address + (detach ? "?detach_only" : ""),
            dispatch,
            "DELETE",
        );
        dispatch(setMessage("Agent " + (detach ? "detached" : "removed") + " successfully"));
    },
);


export const updateAgent = asyncThunk<IAgent, {address: string; agent: AgentUpdateForm;}>(
    'agents/updateAgent',
    async ({address, agent}, {dispatch}) => {
        const response = await doFetch<IAgent> (
            "/agent/" + address,
            dispatch,
            "PUT",
            agent,
        );
        dispatch(setMessage("Agent updated successfully"));
        return response;
    },
);


export const getAgentState = asyncThunk<IAgentState, {address: string;}>(
    'agents/getAgentState',
    async ({address}, {dispatch}) => {
        return await doFetch<IAgentState> (
            "/agent/" + address + "/state",
            dispatch,
        );
    },
);


export const getCollectors = asyncThunk<ICollector[]>(
    'agents/getCollectors',
    async (_, {dispatch}) => {
        return await doFetch<ICollector[]> (
            "/collector",
            dispatch,
        );
    },
);


export const reserveProject = asyncThunk<void, {address: string; projectName: string;}>(
    'agents/reserveProject',
    async ({address, projectName}, {dispatch}) => {
        const project = projectName ? projectName : null;
        await doFetch<any> (
            "/agent/" + address,
            dispatch,
            "POST",
            {action: "reserve_project", project},
        );
        const msg = project === null ? "freed from project" : "associated to project " + project;
        dispatch(setMessage("Agent successfully " + msg));
    },
);


export const getJobs = asyncThunk<string[], {address: string;}>(
    'agents/getJobs',
    async ({address}, {dispatch}) => {
        const response = await doFetch<InstalledJobs>(
            "/job?address=" + address,
            dispatch
        );
        return response.installed_jobs.map((j: {name: string;}) => j.name);
    },
);
