import {createSlice} from '@reduxjs/toolkit';

import {getCollectors, getAgents, addAgent, removeAgent, updateAgent, reserveProject} from '../api/agents';
import {getJobs, addJob, addExternalJob, addInternalJob} from '../api/jobs';
import {getProjects, addProject, importProject, deleteProject} from '../api/projects';
import type {IAgent, IJob, ICollector, IProject} from '../utils/interfaces';


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
                const {projects, collectors, jobs} = state;
                return {projects, collectors, jobs};
            })
            .addCase(getAgents.fulfilled, (state, action) => {
                return {...state, agents: action.payload};
            })
            .addCase(getProjects.pending, (state, action) => {
                const {agents, collectors, jobs} = state;
                return {agents, collectors, jobs};
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
                const {agents, projects, jobs} = state;
                return {agents, projects, jobs};
            })
            .addCase(getCollectors.fulfilled, (state, action) => {
                return {...state, collectors: action.payload};
            })
            .addCase(getJobs.pending, (state, action) => {
                const {agents, projects, collectors} = state;
                return {agents, projects, collectors};
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
            });
    },
});


// export const {} = openbachSlice.actions;
export default openbachSlice.reducer;
