import {add, get as getAll, remove, reserveProject as reserve, update} from "../api/agent";
import {IAgent, IAgentUpdateForm} from "../interfaces/agent.interface";
import {
    ADD_AGENT_ERROR,
    ADD_AGENT_PENDING,
    ADD_AGENT_SUCCESS,
    FORM_RESET,
    GET_AGENTS_ERROR,
    GET_AGENTS_PENDING,
    GET_AGENTS_SUCCESS,
    GET_AGENTS_VERBOSE_ERROR,
    GET_AGENTS_VERBOSE_PENDING,
    GET_AGENTS_VERBOSE_SUCCESS,
    REMOVE_AGENT_ERROR,
    REMOVE_AGENT_PENDING,
    REMOVE_AGENT_SUCCESS,
    RESERVE_AGENT_ERROR,
    RESERVE_AGENT_PENDING,
    RESERVE_AGENT_SUCCESS,
} from "../utils/constants";


export function addAgent(reattach: boolean = false) {
    return (dispatch, getState) => {
        const form = getState().form.agent.values;
        const agent: IAgent = {
            address: form.ipAddress,
            collector_ip: form.collector,
            name: form.name,
            password: form.password,
            username: form.username,
        };
        return dispatch({
            payload: {
                promise: add(agent, reattach),
            },
            types: [
                ADD_AGENT_PENDING,
                ADD_AGENT_SUCCESS,
                ADD_AGENT_ERROR,
            ],
        });
    };
};


export function getAgents(services: boolean, verbose?: boolean) {
    const types = verbose ? [
        GET_AGENTS_VERBOSE_PENDING,
        GET_AGENTS_VERBOSE_SUCCESS,
        GET_AGENTS_VERBOSE_ERROR,
    ] : [
        GET_AGENTS_PENDING,
        GET_AGENTS_SUCCESS,
        GET_AGENTS_ERROR,
    ];

    return (dispatch, getState) => {
        return dispatch({
            payload: { promise: getAll(services) },
            types,
        });
    };
};


export function removeAgent(address: string, detach: boolean = false) {
    return (dispatch, getState) => {
        return dispatch({
            payload: {
                promise: remove(address, detach),
            },
            types: [
                REMOVE_AGENT_PENDING,
                REMOVE_AGENT_SUCCESS,
                REMOVE_AGENT_ERROR,
            ],
        });
    };
};


export function reserveProject(address: string, project?: string) {
    return (dispatch, getState) => {
        return dispatch({
            payload: {
                promise: reserve(address, project),
            },
            types: [
                RESERVE_AGENT_PENDING,
                RESERVE_AGENT_SUCCESS,
                RESERVE_AGENT_ERROR,
            ],
        });
    };
};


export function updateAgent(address: string) {
    return (dispatch, getState) => {
        const form = getState().form.agentUpdate.values;
        const agent: IAgentUpdateForm = {
            agent_ip: form.address || undefined,
            collector_ip: form.collector || undefined,
            name: form.name || undefined,
        };
        return dispatch({
            payload: {
                promise: update(address, agent)
                    .then((res) => {
                        dispatch({
                            form: "agentUpdate",
                            type: FORM_RESET,
                        });
                        return res;
                    }),
            },
            types: [
                ADD_AGENT_PENDING,
                ADD_AGENT_SUCCESS,
                ADD_AGENT_ERROR,
            ],
        });
    };
};
