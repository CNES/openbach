import {GET_JSON_SUCCESS} from "../utils/constants";


function editorReducer(state = null, action = {type: "", payload: null}) {
    switch (action.type) {
        case GET_JSON_SUCCESS:
            return action.payload;

        default:
            return state;
    }
};


export default editorReducer;
