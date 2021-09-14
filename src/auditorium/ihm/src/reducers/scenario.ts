import {
    CLEAR_FILTERED_SCENARIO_INSTANCES,
    CLEAR_SCENARIO_INSTANCES,
    CLEAR_SCENARIO_INSTANCE_ERROR,
    DELETE_SCENARIO_INSTANCES_SUCCESS,
    GET_SCENARIO_INSTANCE_SUCCESS,
    GET_SCENARIO_INSTANCES_SUCCESS,
    GET_FILTERED_SCENARIO_INSTANCES_SUCCESS,
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
        case GET_SCENARIO_INSTANCE_SUCCESS:
            const instance: IScenarioInstance = action.payload;
            const id = instance.scenario_instance_id;
            const index = state.all.findIndex((i: IScenarioInstance) => i.scenario_instance_id === id);
            let currentIndex = -1;
            const currentScenario: { [name: string]: boolean; } = {};
            state.current.forEach((i: IScenarioInstance, idx: number) => {
                currentScenario[i.scenario_name] = true;
                if (i.scenario_instance_id === id) {
                    currentIndex = idx;
                }
            });

            const newState = {...state};
            const keep_others = (i: IScenarioInstance) => i.scenario_instance_id === id ? instance : i;

            if (currentIndex === -1) {
                // Not present => add on top
                if (Object.keys(currentScenario).length !== 1) {
                    newState.current = [instance];
                } else if (currentScenario.hasOwnProperty(instance.scenario_name)) {
                    // only if it's for our specific scenario
                    newState.current = [instance, ...state.current];
                }
            } else {
                // Present => replace
                newState.current = state.current.map(keep_others);
            }

            if (index === -1) {
                // Not present => add on top
                if (currentIndex === -1) {
                    // only if it wasn't an update for a specific scenario
                    newState.all = [instance, ...state.all];
                }
            } else {
                // Present => replace
                newState.all = state.all.map(keep_others);
            }

            return newState;

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
