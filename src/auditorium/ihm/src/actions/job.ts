import {
  addExternalJob as addExternal,
  addInternalJob as addInternal,
  addJob as add,
  get as getAll,
} from "../api/job";
import {IJob} from "../interfaces/job.interface";
import {
    ADD_JOB_ERROR,
    ADD_JOB_PENDING,
    ADD_JOB_SUCCESS,
    GET_JOBS_ERROR,
    GET_JOBS_PENDING,
    GET_JOBS_SUCCESS,
} from "../utils/constants";


export function getJobs() {
    return (dispatch, getState) => {
        return dispatch({
            payload: {
                promise: getAll(),
            },
            types: [
                GET_JOBS_PENDING,
                GET_JOBS_SUCCESS,
                GET_JOBS_ERROR,
            ],
        });
    };
};


export function addJob(jobName: string, jobFile: File) {
    return (dispatch) => {
        return dispatch({
            payload: {
                promise: add(jobName, jobFile),
            },
            types: [
                ADD_JOB_PENDING,
                ADD_JOB_SUCCESS,
                ADD_JOB_ERROR,
            ],
        });
    };
};


export function addExternalJob(jobName: string) {
    return (dispatch) => {
        return dispatch({
            payload: {
                promise: addExternal(jobName),
            },
            types: [
                ADD_JOB_PENDING,
                ADD_JOB_SUCCESS,
                ADD_JOB_ERROR,
            ],
        });
    };
};


export function addInternalJob(jobName: string) {
    return (dispatch) => {
        return dispatch({
            payload: {
                promise: addInternal(jobName),
            },
            types: [
                ADD_JOB_PENDING,
                ADD_JOB_SUCCESS,
                ADD_JOB_ERROR,
            ],
        });
    };
};
