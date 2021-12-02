import {ADD_AGENT_SUCCESS, GET_AGENTS_SUCCESS, GET_AGENTS_VERBOSE_SUCCESS} from "../utils/constants";

import {IAgent} from "../interfaces/agent.interface";

const INITIAL_STATE = [];

function agentReducer(state: IAgent[] = INITIAL_STATE, action = {payload: null, type: ""}) {
    switch (action.type) {
        case ADD_AGENT_SUCCESS:
            const agent: IAgent = action.payload;
            const index = state.findIndex((a: IAgent) => a.address === agent.address);
            if (index === -1) {
                state.push(agent);
            } else {
                state[index] = agent;
            }
            return state;

        case GET_AGENTS_VERBOSE_SUCCESS:
        case GET_AGENTS_SUCCESS:
            return action.payload.sort((a: IAgent, b: IAgent) => a.address.localeCompare(b.address));

        default:
            return state;
    }
}

export default agentReducer;
