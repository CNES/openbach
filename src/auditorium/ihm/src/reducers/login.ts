import {ILoginCredentials} from "../interfaces/login.interface";
import {DELETE_LOGIN_CREDENTIALS_SUCCESS, GET_LOGIN_CREDENTIALS_SUCCESS} from "../utils/constants";


const INITIAL_STATE: ILoginCredentials = {
    email: undefined,
    favorites: {},
    first_name: undefined,
    is_admin: false,
    is_user: false,
    last_name: undefined,
    name: undefined,
    username: undefined,
};


function loginReducer(state: ILoginCredentials = INITIAL_STATE, action = {payload: null, type: ""}) {
    switch (action.type) {
        case GET_LOGIN_CREDENTIALS_SUCCESS:
            return action.payload;

        case DELETE_LOGIN_CREDENTIALS_SUCCESS:
            return INITIAL_STATE;

        default:
            return state;
    }
};


export default loginReducer;
