import {doFetch, asyncThunk} from './base';
import {setMessage} from '../redux/message';

import type {IProject, INetwork} from '../utils/interfaces';


export const getProjects = asyncThunk<IProject[]>(
    'projects/getProjects',
    async (_, {dispatch}) => {
        return await doFetch<IProject[]>(
            "/openbach/project/",
            dispatch,
        );
    },
);


export const getProject = asyncThunk<IProject, {name: string;}>(
    'projects/getProject',
    async ({name}, {dispatch}) => {
        return await doFetch<IProject>(
            "/openbach/project/" + name + "/",
            dispatch,
        );
    },
);


export const updateProject = asyncThunk<IProject, {name: string; project: IProject;}>(
    'projects/updateProject',
    async ({name, project}, {dispatch}) => {
        const response = await doFetch<IProject>(
            "/openbach/project/" + name + "/",
            dispatch,
            "PUT",
            project,
        );
        dispatch(setMessage("Project updated"));
        return response;
    },
);


export const deleteProject = asyncThunk<void, {name: string;}>(
    'projects/deleteProject',
    async ({name}, {dispatch}) => {
        await doFetch<{}>(
            "/openbach/project/" + name + "/",
            dispatch,
            "DELETE",
        );
        dispatch(setMessage("Project " + name + " permanently deleted"));
    },
);


export const addProject = asyncThunk<IProject, {name: string; description: string; isPublic: boolean;}>(
    'projects/addProject',
    async ({name, description, isPublic}, {getState, dispatch}) => {
        const body = {
            name,
            description,
            entity: [],
            hidden_network: [],
            network: [],
            scenario: [],
            owners: [] as string[],
        };

        if (!isPublic) {
            const {username} = getState().login;
            if (username) {
                body.owners.push(username);
            }
        }

        return await doFetch<IProject>(
            "/openbach/project/",
            dispatch,
            "POST",
            body,
        );
    },
);


export const importProject = asyncThunk<IProject, {project: File; ignoreTopology: boolean;}>(
    'projects/importProject',
    async ({project, ignoreTopology}, {dispatch}) => {
        return await doFetch<IProject>(
            "/openbach/project/" + ignoreTopology ? "?ignore_topology" : "",
            dispatch,
            "POST",
            project,
        );
    },
);


export const refreshTopology = asyncThunk<IProject, {project: string; newName?: INetwork;}>(
    'projects/refreshTopology',
    async ({project, newName}, {dispatch}) => {
        dispatch(setMessage("Updating Topology, please wait!"));
        return await doFetch<IProject>(
            "/openbach/project/" + project + "/",
            dispatch,
            "POST",
            newName ? {networks: [newName]} : {},
        );
    },
);
