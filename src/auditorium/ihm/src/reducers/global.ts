import { SET_TITLE, UPDATE_SCENARIO_PENDING, UPDATE_SCENARIO_SUCCESS } from "../utils/constants";


const INITIAL_STATE: IGlobalState = {
    title: "OpenBach",
};


interface IGlobalState {
    title: string;
};


function globalReducer(state = INITIAL_STATE, action = {payload: null, message: null, title: null, type: ""}): IGlobalState {
    switch (action.type) {
        case SET_TITLE:
            return {
                title: action.title,
            };

        default:
            return state;
    }
}


export default globalReducer;
