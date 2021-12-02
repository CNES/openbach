import {
    ADD_SCENARIO_SUCCESS,
    GET_PROJECT_PENDING,
    GET_PROJECT_SUCCESS,
    MODIFY_ENTITY_SUCCESS,
    REFRESH_TOPOLOGY_SUCCESS,
    REMOVE_SCENARIO_SUCCESS,
    UPDATE_PROJECT_SUCCESS,
    UPDATE_SCENARIO_SUCCESS,
} from "../utils/constants";

import {IProject, IScenario} from "../interfaces/project.interface";


interface IState {
    current: IProject;
};

const INITIAL_STATE: IState = {
    current: undefined,
};

function projectReducer(state: IState = INITIAL_STATE, action = {payload: null, type: ""}) {
    switch (action.type) {
        case GET_PROJECT_PENDING:
            return { current: undefined };

        case GET_PROJECT_SUCCESS:
        case MODIFY_ENTITY_SUCCESS:
        case REFRESH_TOPOLOGY_SUCCESS:
        case UPDATE_PROJECT_SUCCESS:
            return { current: action.payload };

        case ADD_SCENARIO_SUCCESS: {
            const {name, description, owners, entity, network, hidden_network, scenario} = state.current;
            return {
                current: {
                    name,
                    description,
                    entity: [...entity],
                    hidden_network: [...hidden_network],
                    network: [...network],
                    owners: [...owners],
                    scenario: [...scenario, action.payload],
                },
            };
        }

        case REMOVE_SCENARIO_SUCCESS: {
            const {name, description, owners, entity, network, hidden_network, scenario} = state.current;
            const removed: string = action.payload.scenario;
            const newScenarios = scenario.filter((scenario: IScenario) => scenario.name !== removed);
            return {
                current: {
                    name,
                    description,
                    entity: [...entity],
                    hidden_network: [...hidden_network],
                    network: [...network],
                    owners: [...owners],
                    scenario: newScenarios,
                },
            };
        }

        case UPDATE_SCENARIO_SUCCESS: {
            const {name, description, owners, entity, network, hidden_network, scenario} = state.current;
            const newScenario: IScenario = action.payload;
            const newScenarios = scenario.map((scenario: IScenario) => scenario.name === newScenario.name ? newScenario : scenario);
            return {
                current: {
                    name,
                    description,
                    entity: [...entity],
                    hidden_network: [...hidden_network],
                    network: [...network],
                    owners: [...owners],
                    scenario: newScenarios,
                },
            };
        }

        default:
            return state;
    }
}

export default projectReducer;
