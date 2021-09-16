import {
    ADD_JOB_ERROR,
    ADD_JOB_SUCCESS,
    ADD_SCENARIO_ERROR,
    ADD_SCENARIO_SUCCESS,
    GET_AGENTS_VERBOSE_ERROR,
    GET_AGENTS_VERBOSE_SUCCESS,
    GET_LOGIN_CREDENTIALS_ERROR,
    GET_SCENARIO_INSTANCE_ERROR,
    MODIFY_ENTITY_ERROR,
    MODIFY_ENTITY_PENDING,
    MODIFY_ENTITY_SUCCESS,
    REFRESH_TOPOLOGY_ERROR,
    REFRESH_TOPOLOGY_PENDING,
    REFRESH_TOPOLOGY_SUCCESS,
    REMOVE_SCENARIO_ERROR,
    REMOVE_SCENARIO_SUCCESS,
    RESERVE_AGENT_ERROR,
    RESERVE_AGENT_SUCCESS,
    SET_SNACKMESSAGE,
    START_SCENARIO_INSTANCE_ERROR,
    START_SCENARIO_INSTANCE_SUCCESS,
    UPDATE_PROJECT_ERROR,
    UPDATE_PROJECT_SUCCESS,
    UPDATE_PROJECTS_ERROR,
    UPDATE_PROJECTS_SUCCESS,
    UPDATE_SCENARIO_ERROR,
    UPDATE_SCENARIO_SUCCESS,
} from "../utils/constants";


const INITIAL_STATE: IDatedMessage = {
    content: null,
    date: null,
};


interface IDatedMessage {
    content: string;
    date: Date;
};


const buildMessage = (message: string): IDatedMessage => ({
    content: message,
    date: new Date(),
});


function snackReducer(state = INITIAL_STATE, action = {payload: null, message: null, type: ""}): IDatedMessage {
    switch (action.type) {
        case SET_SNACKMESSAGE:
            return {
                content: action.message.content,
                date: action.message.date,
            };

        case GET_LOGIN_CREDENTIALS_ERROR:
            return buildMessage(action.payload.message);

        case ADD_JOB_SUCCESS:
            return buildMessage("Job successfuly added");

        case MODIFY_ENTITY_PENDING:
        case REFRESH_TOPOLOGY_PENDING:
            return buildMessage("Rebuilding project topology. Please wait!");

        case REFRESH_TOPOLOGY_SUCCESS:
            return buildMessage("Topology correctly rebuilt");

        case MODIFY_ENTITY_SUCCESS:
        case UPDATE_PROJECT_SUCCESS:
            return buildMessage("Project successfully modified");

        case UPDATE_PROJECTS_SUCCESS:
            return buildMessage("Project successfully added");

        case ADD_SCENARIO_SUCCESS:
            return buildMessage("Scenario " + action.payload.name + " successfully added");

        case REMOVE_SCENARIO_SUCCESS:
            return buildMessage("Scenario " + action.payload.scenario + " successfully deleted");

        case UPDATE_SCENARIO_SUCCESS:
            return buildMessage("Scenario successfully saved");

        case START_SCENARIO_INSTANCE_SUCCESS:
            return buildMessage("Successfully launched scenario");

        case GET_AGENTS_VERBOSE_SUCCESS:
            return buildMessage("Successfully fetched statuses on agents");

        case RESERVE_AGENT_SUCCESS:
            return buildMessage("Successfully changed agent booking");

        case ADD_SCENARIO_ERROR:
        case ADD_JOB_ERROR:
        case GET_AGENTS_VERBOSE_ERROR:
        case GET_SCENARIO_INSTANCE_ERROR:
        case MODIFY_ENTITY_ERROR:
        case REFRESH_TOPOLOGY_ERROR:
        case REMOVE_SCENARIO_ERROR:
        case RESERVE_AGENT_ERROR:
        case UPDATE_PROJECT_ERROR:
        case UPDATE_PROJECTS_ERROR:
        case UPDATE_SCENARIO_ERROR:
            return buildMessage("Something went wrong: " + action.payload.message);

        case START_SCENARIO_INSTANCE_ERROR:
            if (!action.payload.hasOwnProperty("entities")) {
                return buildMessage("Something went wrong: " + action.payload.error);
            }

        default:
            return state;
    }
}


export default snackReducer;
