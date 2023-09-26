import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {stateJob} from '../api/jobs';
import {getProject, updateProject, refreshTopology} from '../api/projects';
import {addEntity, removeEntity, updateEntityAgent} from '../api/entities';
import {
    addScenario, importScenario, updateScenario, saveScenario,
    deleteScenario, launchScenario, deleteScenarioInstance,
    getScenariosInstances, getScenarioInstances, getScenarioInstance,
} from '../api/scenarios';
import type {IProject, IJobState, IScenario, IScenarioInstance} from '../utils/interfaces';


interface ProjectState {
    current?: IProject;
    scenarioInstances: IScenarioInstance[];
    currentScenarioInstances: IScenarioInstance[];
    moreInstances: boolean;
    moreCurrentInstances: boolean;
    jobActions: JobActionQuery[];
}


interface JobActionQuery {
    job: string;
    agent: string;
    action: keyof IJobState;
    result?: IJobState;
}


const initialState: ProjectState = {
    scenarioInstances: [],
    currentScenarioInstances: [],
    moreInstances: true,
    moreCurrentInstances: true,
    jobActions: [],
};


const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        selectNewScenario: (state) => {
            return {...state, currentScenarioInstances: [], moreCurrentInstances: true};
        },
        addJobAction: (state, action: PayloadAction<JobActionQuery>) => {
            const jobActions = [...state.jobActions, action.payload];
            return {...state, jobActions};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getProject.pending, (state, action) => {
                return {...initialState};
            })
            .addCase(getProject.fulfilled, (state, action) => {
                return {...initialState, current: action.payload};
            })
            .addCase(stateJob.fulfilled, (state, action) => {
                const {jobName, agent} = action.meta.arg;
                const jobActions = state.jobActions.map((query: JobActionQuery) => (
                    query.job === jobName && query.agent === agent ? {...query, result: action.payload} : query
                ));
                return {...state, jobActions};
            })
            .addCase(deleteScenarioInstance.fulfilled, (state, action) => {
                const filter = (s: IScenarioInstance) => s.scenario_instance_id !== action.meta.arg.instance;
                const scenarioInstances = state.scenarioInstances.filter(filter);
                const currentScenarioInstances = state.currentScenarioInstances.filter(filter);
                return {...state, scenarioInstances, currentScenarioInstances};
            })
            .addCase(launchScenario.fulfilled, (state, action) => {
                const scenarioInstances = [action.payload, ...state.scenarioInstances];
                const currentScenarioInstances = [action.payload, ...state.currentScenarioInstances]
                return {...state, scenarioInstances, currentScenarioInstances};
            })
            .addCase(getScenariosInstances.fulfilled, (state, action) => {
                const scenarioInstances = [...state.scenarioInstances, ...action.payload];
                const moreInstances = action.payload.length > 0;
                return {...state, scenarioInstances, moreInstances};
            })
            .addCase(getScenarioInstances.fulfilled, (state, action) => {
                const currentScenarioInstances = [...state.currentScenarioInstances, ...action.payload];
                const moreCurrentInstances = action.payload.length > 0;
                return {...state, currentScenarioInstances, moreCurrentInstances};
            })
            .addCase(getScenarioInstance.fulfilled, (state, action) => {
                const filler = (s: IScenarioInstance) => (
                    s.scenario_instance_id !== action.meta.arg.instance
                    ? s
                    : action.payload
                );
                const scenarioInstances = state.scenarioInstances.map(filler);
                const currentScenarioInstances = state.currentScenarioInstances.map(filler);
                return {...state, scenarioInstances, currentScenarioInstances};
            })
            .addCase(addScenario.fulfilled, (state, action) => {
                const project = state.current;
                if (project) {
                    const scenario = [action.payload, ...project.scenario];
                    const current = {...project, scenario};
                    return {...state, current};
                }
            })
            .addCase(importScenario.fulfilled, (state, action) => {
                const project = state.current;
                if (project) {
                    const scenario = [action.payload, ...project.scenario];
                    const current = {...project, scenario};
                    return {...state, current};
                }
            })
            .addCase(updateScenario.fulfilled, (state, action) => {
                const project = state.current;
                if (project) {
                    const {name} = action.payload;
                    const scenario = project.scenario.map((s: IScenario) => s.name === name ? action.payload : s);
                    const current = {...project, scenario};
                    return {...state, current};
                }
            })
            .addCase(saveScenario.fulfilled, (state, action) => {
                const project = state.current;
                if (project) {
                    const {name} = action.payload;
                    const scenario = project.scenario.map((s: IScenario) => s.name === name ? action.payload : s);
                    const current = {...project, scenario};
                    return {...state, current};
                }
            })
            .addCase(deleteScenario.fulfilled, (state, action) => {
                const project = state.current;
                if (project) {
                    const {scenario: name} = action.meta.arg;
                    const scenario = project.scenario.filter((s: IScenario) => s.name !== name);
                    const current = {...project, scenario};
                    return {...state, current};
                }
            })
            .addCase(addEntity.fulfilled, (state, action) => {
                const {name} = action.payload;
                if (!state.current || state.current.name === name) {
                    return {...state, current: action.payload};
                }
            })
            .addCase(removeEntity.fulfilled, (state, action) => {
                const {name} = action.payload;
                if (!state.current || state.current.name === name) {
                    return {...state, current: action.payload};
                }
            })
            .addCase(updateEntityAgent.fulfilled, (state, action) => {
                const {name} = action.payload;
                if (!state.current || state.current.name === name) {
                    return {...state, current: action.payload};
                }
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                const {name} = action.payload;
                if (!state.current || state.current.name === name) {
                    return {...state, current: action.payload};
                }
            })
            .addCase(refreshTopology.fulfilled, (state, action) => {
                const {name} = action.payload;
                if (!state.current || state.current.name === name) {
                    return {...state, current: action.payload};
                }
            });
    },
});


export const {selectNewScenario, addJobAction} = projectSlice.actions;
export default projectSlice.reducer;
