import {GET_LOGS_SUCCESS} from "../utils/constants";


const INITIAL_STATE = [];


function logsReducer(state = INITIAL_STATE, action = {payload: null, type: ""}) {
    switch (action.type) {
        case GET_LOGS_SUCCESS:
            return state = action.payload;

        default:
            return state;
    }
}


export default logsReducer;
