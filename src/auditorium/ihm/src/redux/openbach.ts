import {createSlice} from '@reduxjs/toolkit';

import {getCollectors, getAgents, addAgent, removeAgent, updateAgent, reserveProject} from '../api/agents';
import {getJobs, addJob, addExternalJob, addInternalJob} from '../api/jobs';
import {getProjects, addProject, importProject, deleteProject} from '../api/projects';
import {addEntity, removeEntity, updateEntityAgent} from '../api/entities';
import type {IAgent, IEntity, IJob, ICollector, IProject} from '../utils/interfaces';


interface OpenBachState {
    agents?: IAgent[];
    projects?: IProject[];
    collectors?: ICollector[];
    jobs?: IJob[];
}


const initialState: OpenBachState = {
};


const openbachSlice = createSlice({
    name: "openbach",
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAgents.pending, (state, action) => {
                const {agents, ...rest} = state;
                return rest;
            })
            .addCase(getAgents.fulfilled, (state, action) => {
                return {...state, agents: action.payload};
            })
            .addCase(getProjects.pending, (state, action) => {
                const {projects, ...rest} = state;
                return rest;
            })
            .addCase(getProjects.fulfilled, (state, action) => {
                return {...state, projects: action.payload};
            })
            .addCase(addAgent.fulfilled, (state, action) => {
                const agents = state.agents ? [...state.agents, action.payload] : [action.payload];
                return {...state, agents};
            })
            .addCase(removeAgent.fulfilled, (state, action) => {
                const {address} = action.meta.arg;
                const agents = state.agents?.filter((agent: IAgent) => agent.address !== address);
                return {...state, agents};
            })
            .addCase(updateAgent.fulfilled, (state, action) => {
                const agents = state.agents?.map((agent: IAgent) => agent.name === action.payload.name ? action.payload : agent);
                return {...state, agents};
            })
            .addCase(reserveProject.fulfilled, (state, action) => {
                const {address, projectName} = action.meta.arg;
                const agents = state.agents?.map((agent: IAgent) => agent.address !== address ? agent : {
                    ...agent,
                    reserved: projectName || undefined,
                });
                return {...state, agents};
            })
            .addCase(getCollectors.pending, (state, action) => {
                const {collectors, ...rest} = state;
                return rest;
            })
            .addCase(getCollectors.fulfilled, (state, action) => {
                return {...state, collectors: action.payload};
            })
            .addCase(getJobs.pending, (state, action) => {
                const {jobs, ...rest} = state;
                return rest;
            })
            .addCase(getJobs.fulfilled, (state, action) => {
                return {...state, jobs: action.payload};
            })
            .addCase(addJob.fulfilled, (state, action) => {
                const jobName = action.payload.general.name;
                const oldJobs = state.jobs?.filter((job: IJob) => job.general.name !== jobName);
                const jobs = oldJobs ? [...oldJobs, action.payload] : [action.payload];
                return {...state, jobs};
            })
            .addCase(addExternalJob.fulfilled, (state, action) => {
                const jobName = action.payload.general.name;
                const oldJobs = state.jobs?.filter((job: IJob) => job.general.name !== jobName);
                const jobs = oldJobs ? [...oldJobs, action.payload] : [action.payload];
                return {...state, jobs};
            })
            .addCase(addInternalJob.fulfilled, (state, action) => {
                const jobName = action.payload.general.name;
                const oldJobs = state.jobs?.filter((job: IJob) => job.general.name !== jobName);
                const jobs = oldJobs ? [...oldJobs, action.payload] : [action.payload];
                return {...state, jobs};
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                const {name} = action.meta.arg;
                const projects = state.projects?.filter((p: IProject) => p.name !== name);
                return {...state, projects};
            })
            .addCase(addProject.fulfilled, (state, action) => {
                const projects = state.projects ? [...state.projects, action.payload] : [action.payload];
                return {...state, projects};
            })
            .addCase(importProject.fulfilled, (state, action) => {
                const projects = state.projects ? [...state.projects, action.payload] : [action.payload];
                return {...state, projects};
            })
            .addCase(addEntity.fulfilled, (state, action) => {
                const {agent} = action.meta.arg;
                if (agent) {
                    const {address} = agent;
                    const newEntity = action.payload.entity.find((e: IEntity) => e.agent && e.agent.address === address);
                    const newAgent = newEntity?.agent
                    if (newAgent && state.agents) {
                        const agents = state.agents.map((a: IAgent) => a.address === address ? newAgent : a);
                        return {...state, agents};
                    }
                }
            })
            .addCase(removeEntity.fulfilled, (state, action) => {
                const {name, entity} = action.payload;
                const oldAgents = state.agents?.filter((a: IAgent) => a.project === name);
                if (oldAgents) {
                    const newAgents = entity.filter((e: IEntity) => e.agent && e.agent.project === name).map((e: IEntity) => e.agent!.address);
                    const removed = oldAgents.find((a: IAgent) => !newAgents.includes(a.address));
                    if (removed) {
                        const agents = state.agents!.map((a: IAgent) => a.address === removed.address ? {...a, project: undefined} : a);
                        return {...state, agents};
                    }
                }
            })
            .addCase(updateEntityAgent.fulfilled, (state, action) => {
                const {name, entity} = action.payload;
                const oldAgents = state.agents?.filter((a: IAgent) => a.project === name).map((a: IAgent) => a.address);
                if (oldAgents) {
                    const newAgents = entity.filter((e: IEntity) => e.agent && e.agent.project === name).map((e: IEntity) => e.agent!.address);
                    const removed = oldAgents.find((address: string) => !newAgents.includes(address));
                    const added = newAgents.find((address: string) => !oldAgents.includes(address));
                    const newAgent = entity.find((e: IEntity) => e.agent && e.agent.address === added)?.agent;
                    const agents = state.agents!.map((a: IAgent) => (
                        newAgent && newAgent.address === a.address
                        ? newAgent
                        : a.address === removed
                        ? {...a, project: undefined}
                        : a
                    ));
                    return {...state, agents};
                }
            });
    },
});


// export const {} = openbachSlice.actions;
export default openbachSlice.reducer;
