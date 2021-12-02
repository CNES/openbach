import {authenticateUser, createUser, deAuthenticateUser, getUser, listUsers, updateUser} from "../api/login";
import {ILoginCredentials, ILoginForm, IProfileForm} from "../interfaces/login.interface";
import {
    DELETE_LOGIN_CREDENTIALS_ERROR,
    DELETE_LOGIN_CREDENTIALS_PENDING,
    DELETE_LOGIN_CREDENTIALS_SUCCESS,
    GET_LOGIN_CREDENTIALS_ERROR,
    GET_LOGIN_CREDENTIALS_PENDING,
    GET_LOGIN_CREDENTIALS_SUCCESS,
    GET_USERS_LIST_ERROR,
    GET_USERS_LIST_PENDING,
    GET_USERS_LIST_SUCCESS,
} from "../utils/constants";


export function getUserCredentials() {
    return (dispatch) => {
        const promise = getUser();
        return dispatch({
            payload: { promise },
            types: [
                GET_LOGIN_CREDENTIALS_PENDING,
                GET_LOGIN_CREDENTIALS_SUCCESS,
                GET_LOGIN_CREDENTIALS_ERROR,
            ],
        });
    };
};


export function updateUserCredentials() {
    return (dispatch, getState) => {
        const form = getState().form.settingsuser.values;
        const login = getState().login.username;
        const settings: IProfileForm = {
            login,
            email: form.email,
            first_name: form.firstName,
            last_name: form.lastName,
        };
        if (form.password) {
            settings.password = form.password;
        }
        const promise = updateUser(settings);
        return dispatch({
            payload: { promise },
            types: [
                GET_LOGIN_CREDENTIALS_PENDING,
                GET_LOGIN_CREDENTIALS_SUCCESS,
                GET_LOGIN_CREDENTIALS_ERROR,
            ],
        });
    };
};


export function createNewUser() {
    return (dispatch, getState) => {
        const form = getState().form.newuser.values;
        const profile: IProfileForm = {
            email: form.email,
            first_name: form.firstName,
            last_name: form.lastName,
            login: form.username,
            password: form.password,
        };
        const promise = createUser(profile);
        return dispatch({
            payload: { promise },
            types: [
                GET_LOGIN_CREDENTIALS_PENDING,
                GET_LOGIN_CREDENTIALS_SUCCESS,
                GET_LOGIN_CREDENTIALS_ERROR,
            ],
        });
    };
};


export function logIn() {
    return (dispatch, getState) => {
        const form = getState().form.login.values;
        const credentials: ILoginForm = {
            login: form.username,
            password: form.password,
        };
        const promise = authenticateUser(credentials);
        return dispatch({
            payload: { promise },
            types: [
                GET_LOGIN_CREDENTIALS_PENDING,
                GET_LOGIN_CREDENTIALS_SUCCESS,
                GET_LOGIN_CREDENTIALS_ERROR,
            ],
        });
    };
};


export function logOut() {
    return (dispatch) => {
        const promise = deAuthenticateUser();
        return dispatch({
            payload: { promise },
            types: [
                DELETE_LOGIN_CREDENTIALS_PENDING,
                DELETE_LOGIN_CREDENTIALS_SUCCESS,
                DELETE_LOGIN_CREDENTIALS_ERROR,
            ],
        });
    };
};


export function getUsersList() {
    return (dispatch) => {
        const promise = listUsers();
        return dispatch({
            payload: { promise },
            types: [
                GET_USERS_LIST_PENDING,
                GET_USERS_LIST_SUCCESS,
                GET_USERS_LIST_ERROR,
            ],
        });
    };
};
