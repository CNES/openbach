import {
    LOGIN_USER_ERROR,
    LOGIN_USER_PENDING,
    LOGIN_USER_SUCCESS,
    LOGOUT_USER,
} from "../utils/constants";

interface ISession {
    hasError: boolean;
    isLoading: boolean;
    token: string;
    user: IUser;
}
interface IUser {
    login?: string;
}

const INITIAL_STATE: ISession = {
    hasError: false,
    isLoading: false,
    token: null,
    user: {},
};

function sessionReducer(state = INITIAL_STATE,
                        action = {payload: null, type: ""}) {
    switch (action.type) {

        case LOGIN_USER_PENDING:
            return {
                hasError: false,
                isLoading: true,
                token: null,
                user: {},
            };

        case LOGIN_USER_SUCCESS:
            return {
                hasError: false,
                isLoading: false,
                token: action.payload.token,
                user: action.payload.profile,
            };

        case LOGIN_USER_ERROR:
            return {
                hasError: true,
                isLoading: false,
                token: null,
                user: {},
            };

        case LOGOUT_USER:
            return INITIAL_STATE;

        default:
            return state;
    }
}

export default sessionReducer;
