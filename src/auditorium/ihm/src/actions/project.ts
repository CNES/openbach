import {
    addEntityToProject,
    addProject,
    changeAgentOfEntity,
    changeHiddenNetwork,
    changeOwnersOfProject,
    get as getAll,
    getProject,
    importProject,
    refreshTopology,
    removeEntityFromProject,
} from "../api/project";
import {IAgent} from "../interfaces/agent.interface";
import {IEntity, IProject} from "../interfaces/project.interface";
import {
    GET_PROJECT_ERROR,
    GET_PROJECT_PENDING,
    GET_PROJECT_SUCCESS,
    GET_PROJECTS_ERROR,
    GET_PROJECTS_PENDING,
    GET_PROJECTS_SUCCESS,
    MODIFY_ENTITY_ERROR,
    MODIFY_ENTITY_PENDING,
    MODIFY_ENTITY_SUCCESS,
    REFRESH_TOPOLOGY_ERROR,
    REFRESH_TOPOLOGY_PENDING,
    REFRESH_TOPOLOGY_SUCCESS,
    UPDATE_PROJECT_ERROR,
    UPDATE_PROJECT_PENDING,
    UPDATE_PROJECT_SUCCESS,
    UPDATE_PROJECTS_ERROR,
    UPDATE_PROJECTS_PENDING,
    UPDATE_PROJECTS_SUCCESS,
} from "../utils/constants";
import {getAgents} from "./agent";


export function getProjects() {
    return (dispatch, getState) => {
        let projectsPromise: Promise<IProject[]>;
        const projects = getState().projects;

        // TODO : Better projects cache
        if (projects && projects.size > 0) {
            projectsPromise = new Promise<IProject[]>((resolve) => resolve(projects));
        } else {
            projectsPromise = getAll();
        }
        return dispatch({
            payload: {
                promise: projectsPromise,
            },
            types: [
                GET_PROJECTS_PENDING,
                GET_PROJECTS_SUCCESS,
                GET_PROJECTS_ERROR,
            ],
        });
    };
};


export function newProject(name: string, description: string, owners: string[]) {
    return (dispatch, getState) => {
        return dispatch({
            payload: {
                promise: addProject(name, description, owners),
            },
            types: [
                UPDATE_PROJECTS_PENDING,
                UPDATE_PROJECTS_SUCCESS,
                UPDATE_PROJECTS_ERROR,
            ],
        });
    };
};


export function newImportedProject(project: File, wipeTopology: boolean) {
    return (dispatch, getState) => {
        return dispatch({
            payload: {
                promise: importProject(project, wipeTopology),
            },
            types: [
                UPDATE_PROJECTS_PENDING,
                UPDATE_PROJECTS_SUCCESS,
                UPDATE_PROJECTS_ERROR,
            ],
        });
    };
};


export function getSingleProject(projectName: string) {
    return (dispatch, getState) => {
        return dispatch({
            payload: {
                promise: getProject(projectName),
            },
            types: [
                GET_PROJECT_PENDING,
                GET_PROJECT_SUCCESS,
                GET_PROJECT_ERROR,
            ],
        });
    };
};


export function changeOwners(owners: string[]) {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: changeOwnersOfProject(project, owners),
            },
            types: [
                UPDATE_PROJECT_PENDING,
                UPDATE_PROJECT_SUCCESS,
                UPDATE_PROJECT_ERROR,
            ],
        });
    };
};


export function addEntity(name: string, description: string, agent: IAgent) {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: addEntityToProject(project, name, description, agent)
                    .then((res) => {
                        dispatch(getAgents(false));
                        return res;
                    }),
            },
            types: [
                MODIFY_ENTITY_PENDING,
                MODIFY_ENTITY_SUCCESS,
                MODIFY_ENTITY_ERROR,
            ],
        });
    };
};


export function changeEntity(entity: IEntity, agent: IAgent) {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: changeAgentOfEntity(project, entity, agent)
                    .then((res) => {
                        dispatch(getAgents(false));
                        return res;
                    }),
            },
            types: [
                MODIFY_ENTITY_PENDING,
                MODIFY_ENTITY_SUCCESS,
                MODIFY_ENTITY_ERROR,
            ],
        });
    };
};


export function removeEntity(entity: IEntity) {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: removeEntityFromProject(project, entity)
                    .then((res) => {
                        dispatch(getAgents(false));
                        return res;
                    }),
            },
            types: [
                MODIFY_ENTITY_PENDING,
                MODIFY_ENTITY_SUCCESS,
                MODIFY_ENTITY_ERROR,
            ],
        });
    };
};


export function showNetworksForProject(networkNames: string[]) {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: changeHiddenNetwork(project, [], networkNames),
            },
            types: [
                REFRESH_TOPOLOGY_PENDING,
                REFRESH_TOPOLOGY_SUCCESS,
                REFRESH_TOPOLOGY_ERROR,
            ],
        });
    };
};


export function hideNetworkForProject(networkName: string) {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: changeHiddenNetwork(project, [networkName], []),
            },
            types: [
                REFRESH_TOPOLOGY_PENDING,
                REFRESH_TOPOLOGY_SUCCESS,
                REFRESH_TOPOLOGY_ERROR,
            ],
        });
    };
};


export function showNetworkForProject(networkName: string) {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: changeHiddenNetwork(project, [], [networkName]),
            },
            types: [
                REFRESH_TOPOLOGY_PENDING,
                REFRESH_TOPOLOGY_SUCCESS,
                REFRESH_TOPOLOGY_ERROR,
            ],
        });
    };
};


export function refreshTopologyForProject() {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: refreshTopology(project),
            },
            types: [
                REFRESH_TOPOLOGY_PENDING,
                REFRESH_TOPOLOGY_SUCCESS,
                REFRESH_TOPOLOGY_ERROR,
            ],
        });
    };
};


export function changeNetworkName(networkAddress: string, newName: string) {
    return (dispatch, getState) => {
        const project: IProject = getState().project.current;
        return dispatch({
            payload: {
                promise: refreshTopology(project, {name: newName, address: networkAddress}),
            },
            types: [
                REFRESH_TOPOLOGY_PENDING,
                REFRESH_TOPOLOGY_SUCCESS,
                REFRESH_TOPOLOGY_ERROR,
            ],
        });
    };
};
