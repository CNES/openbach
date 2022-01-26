import {
    CLEAR_FILTERED_SCENARIO_INSTANCES,
    CLEAR_SCENARIO_INSTANCE_ERROR,
    CLEAR_SCENARIO_INSTANCES,
    DELETE_SCENARIO_INSTANCES_SUCCESS,
    GET_FILTERED_SCENARIO_INSTANCES_SUCCESS,
    GET_SCENARIO_INSTANCE_SUCCESS,
    GET_SCENARIO_INSTANCES_SUCCESS,
    PUT_SCENARIO_INSTANCE_SUCCESS,
    START_SCENARIO_INSTANCE_ERROR,
} from "../utils/constants";

import {IScenarioInstance, IScenarioInstanceState, IStartScenarioError} from "../interfaces/scenarioInstance.interface";

const INITIAL_STATE: IScenarioInstanceState = {
    all: [],
    current: [],
    more: true,
    moreCurrent: true,
};


function scenarioReducer(state: IScenarioInstanceState = INITIAL_STATE, action = {payload: null, type: ""}) {
    switch (action.type) {
        case PUT_SCENARIO_INSTANCE_SUCCESS:
            const startedInstance: IScenarioInstance = action.payload;
            const all = [startedInstance, ...state.all];
            const current = startedInstance.scenario_name === state.currentScenario ? [startedInstance, ...state.current] : [...state.current];
            return {...state, all, current};

        case GET_SCENARIO_INSTANCE_SUCCESS:
            const instance: IScenarioInstance = action.payload;
            const id = instance.scenario_instance_id;
            const keep_others = (i: IScenarioInstance) => i.scenario_instance_id === id ? instance : i;
            return {
                ...state,
                all: state.all.map(keep_others),
                current: state.current.map(keep_others),
            };

        case GET_SCENARIO_INSTANCES_SUCCESS:
            return {
                ...state,
                all: state.all.concat(action.payload),
                more: action.payload.length === 15,
            };

        case GET_FILTERED_SCENARIO_INSTANCES_SUCCESS:
            return {
                ...state,
                current: state.current.concat(action.payload),
                moreCurrent: action.payload.length === 15,
            };

        case DELETE_SCENARIO_INSTANCES_SUCCESS:
            const removedID = action.payload.scenario_instance_id;
            const without_removed = (i: IScenarioInstance) => i.scenario_instance_id !== removedID;
            return {
                ...state,
                all: state.all.filter(without_removed),
                current: state.current.filter(without_removed),
            };

        case CLEAR_SCENARIO_INSTANCES:
            return {
                all: [],
                current: [],
                more: true,
                moreCurrent: true,
            };

        case CLEAR_FILTERED_SCENARIO_INSTANCES:
            return {
                ...state,
                current: [],
                currentScenario: action.payload as string,
                moreCurrent: true,
            };

        case START_SCENARIO_INSTANCE_ERROR:
            const error: IStartScenarioError = action.payload;
            if (!error.hasOwnProperty("entities")) {
                return state;
            }
            return {
                ...state,
                startError: error,
            };

        case CLEAR_SCENARIO_INSTANCE_ERROR:
            return {
                ...state,
                startError: undefined,
            };

        default:
            return state;
    }
}

export default scenarioReducer;
