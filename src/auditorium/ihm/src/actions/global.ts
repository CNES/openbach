import {doApiCall} from "../api/common";
import {get as getProjects, getProject} from "../api/project";
import {
    CLEAR_FILTERED_SCENARIO_INSTANCES,
    CLEAR_SCENARIO_INSTANCE_ERROR,
    CLEAR_SCENARIO_INSTANCES,
    GET_JSON_ERROR,
    GET_JSON_PENDING,
    GET_JSON_SUCCESS,
    GET_LOGS_ERROR,
    GET_LOGS_PENDING,
    GET_LOGS_SUCCESS,
    GET_PROJECT_ERROR,
    GET_PROJECT_PENDING,
    GET_PROJECT_SUCCESS,
    GET_PROJECTS_ERROR,
    GET_PROJECTS_PENDING,
    GET_PROJECTS_SUCCESS,
    PUT_JSON_ERROR,
    PUT_JSON_PENDING,
    PUT_JSON_SUCCESS,
    SET_SNACKMESSAGE,
    SET_TITLE,
} from "../utils/constants";


export function setTitle(title: string) {
    return {
        type: SET_TITLE,
        title,
    };
};


export function notify(message: string) {
    return {
        message: {content: message, date: new Date()},
        type: SET_SNACKMESSAGE,
    };
};


export function downloadJSON(route: string) {
    return (dispatch, getState) => {
        const promise = doApiCall(route).then((response: Response) => response.json());
        return dispatch({
            payload: {
                promise,
            },
            types: [
                GET_JSON_PENDING,
                GET_JSON_SUCCESS,
                GET_JSON_ERROR,
            ],
        });
    };
};


export function clearScenarioInstances() {
    return {
        payload: null,
        type: CLEAR_SCENARIO_INSTANCES,
    };
};


export function clearCurrentScenarioInstances(scenarioName?: string) {
    return {
        payload: scenarioName,
        type: CLEAR_FILTERED_SCENARIO_INSTANCES,
    };
};


export function clearStartScenarioInstanceError() {
    return {
        payload: null,
        type: CLEAR_SCENARIO_INSTANCE_ERROR,
    };
};


export function clearJSON() {
    return {
        payload: null,
        type: GET_JSON_SUCCESS,
    };
};


export function submitJSON(route: string, data: { [propName: string]: any; }, projectName?: string) {
    return (dispatch, getState) => {
        const reloadTypes = projectName ? [
            GET_PROJECT_PENDING,
            GET_PROJECT_SUCCESS,
            GET_PROJECT_ERROR,
        ] : [
            GET_PROJECTS_PENDING,
            GET_PROJECTS_SUCCESS,
            GET_PROJECTS_ERROR,
        ];
        const promise = doApiCall(route, "PUT", data).then((res) => {
            dispatch({
                payload: { promise: projectName ? getProject(projectName) : getProjects() },
                types: reloadTypes,
            });
            return res;
        }).then(() => {
            dispatch({
                message: {content: "Update successfull", date: new Date()},
                type: SET_SNACKMESSAGE,
            });
        }).catch((error: Error) => {
            dispatch({
                message: {content: "Error while updating: " + error.message, date: new Date()},
                type: SET_SNACKMESSAGE,
            });
        });
        return dispatch({
            payload: {
                promise,
            },
            types: [
                PUT_JSON_PENDING,
                PUT_JSON_SUCCESS,
                PUT_JSON_ERROR,
            ],
        });
    };
};


export function fetchLogs(delay: number) {
    return (dispatch, getState) => {
        const route = `/logs/?level=4&delay=${delay}`;
        const promise = doApiCall(route, "GET").then((response: Response) => response.json());
        return dispatch({
            payload: {
                promise,
            },
            types: [
                GET_LOGS_PENDING,
                GET_LOGS_SUCCESS,
                GET_LOGS_ERROR,
            ],
        });
    };
};
