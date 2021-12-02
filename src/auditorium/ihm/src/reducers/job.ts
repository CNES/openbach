import {ADD_JOB_SUCCESS, GET_JOBS_SUCCESS} from "../utils/constants";

import {cloneDeep} from "lodash";

import {IJob} from "../interfaces/job.interface";

const INITIAL_STATE = [];

function jobReducer(state: IJob[] = INITIAL_STATE, action = {payload: null, type: ""}) {
    switch (action.type) {
        case GET_JOBS_SUCCESS:
            const jobs: IJob[] = action.payload.map((job: IJob) => job);
            jobs.sort((a: IJob, b: IJob) => a.general.name === b.general.name ? 0 : (a.general.name < b.general.name ? -1 : 1));
            return jobs;
        case ADD_JOB_SUCCESS:
            const new_job: IJob = action.payload;
            const old_jobs = state.filter((job: IJob) => job.general.name !== new_job.general.name);
            return [...old_jobs, new_job];
        default:
            return state;
    }
}

export default jobReducer;
