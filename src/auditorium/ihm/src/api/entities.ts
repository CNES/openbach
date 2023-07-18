import {doFetch, asyncThunk} from './base';
import {setMessage} from '../redux/message';

import type {IProject, IAgent, INetwork} from '../utils/interfaces';


interface EntityId {
    project: string;
    name: string;
}


interface EntityForm extends EntityId {
    description?: string;
    agent?: IAgent;
}


export const addEntity = asyncThunk<IProject, EntityForm>(
    'entities/addEntity',
    async ({project, name, description, agent}, {dispatch}) => {
        dispatch(setMessage("Rebuilding project topology. Please wait..."));
        const response = await doFetch<IProject>(
            "/openbach/project/" + project + "/entity/",
            dispatch,
            "POST",
            {name, description, agent},
        );
        dispatch(setMessage("Entity added to project"));
        return response;
    },
);


export const removeEntity = asyncThunk<IProject, EntityId>(
    'entities/removeEntity',
    async ({project, name}, {dispatch}) => {
        dispatch(setMessage("Rebuilding project topology. Please wait..."));
        const response = await doFetch<IProject>(
            "/openbach/project/" + project + "/entity/" + name,
            dispatch,
            "DELETE",
        );
        dispatch(setMessage("Entity removed from project"));
        return response;
    },
);


export const updateEntityAgent = asyncThunk<IProject, EntityForm & {networks?: INetwork[];}>(
    'entities/updateEntityAgent',
    async ({project, name, description, agent, networks}, {dispatch}) => {
        dispatch(setMessage("Rebuilding project topology. Please wait..."));
        const response = await doFetch<IProject>(
            "/openbach/project/" + project + "/entity/" + name,
            dispatch,
            "PUT",
            {name, description, agent, networks},
        );
        dispatch(setMessage("Entity updated"));
        return response;
    },
);
