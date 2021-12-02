import {GET_PROJECTS_SUCCESS, RESERVE_AGENT_SUCCESS, UPDATE_PROJECTS_SUCCESS} from "../utils/constants";

import {IProject} from "../interfaces/project.interface";

const INITIAL_STATE = [];

function projectReducer(state: IProject[] = INITIAL_STATE, action = {payload: null, type: ""}) {
    switch (action.type) {
        case GET_PROJECTS_SUCCESS:
        case RESERVE_AGENT_SUCCESS:
            return action.payload;

        case UPDATE_PROJECTS_SUCCESS:
            return [action.payload, ...state];

        default:
            return state;
    }
}

export default projectReducer;
