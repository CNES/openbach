import {ILoginCredentials} from "../interfaces/login.interface";
import {GET_USERS_LIST_SUCCESS} from "../utils/constants";


function usersReducer(state: ILoginCredentials[] = [], action = {payload: null, type: ""}) {
    switch (action.type) {
        case GET_USERS_LIST_SUCCESS:
            return action.payload;

        default:
            return state;
    }
};


export default usersReducer;
