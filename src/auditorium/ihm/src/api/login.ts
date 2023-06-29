import {doFetch, asyncThunk} from './base';
import {setMessage} from '../redux/message';

import type {ICredentials, IProfilePermissions} from '../utils/interfaces';


interface LoginForm {
    login: string;
    password?: string;
}


interface UserForm {
    email?: string;
    first_name?: string;
    last_name?: string;
}


declare type CreateForm = UserForm & Required<LoginForm>;
declare type UpdateForm = UserForm & LoginForm;


export const getLogin = asyncThunk<ICredentials>(
    'login/getLogin',
    async (_, {dispatch}) => {
        return await doFetch<ICredentials>(
            "/login",
            dispatch,
        );
    },
);


export const doLogin = asyncThunk<ICredentials, Required<LoginForm>>(
    'login/doLogin',
    async ({login, password}, {dispatch}) => {
        return await doFetch<ICredentials>(
            "/login",
            dispatch,
            "POST",
            {login, password},
        );
    },
);


export const doLogout = asyncThunk<void>(
    'login/doLogout',
    async (_, {dispatch}) => {
        await doFetch<{}>(
            "/login",
            dispatch,
            "DELETE",
        );
        dispatch(setMessage("Disconnected"));
    },
);


export const getUsers = asyncThunk<ICredentials[]>(
    'login/getUsers',
    async (_, {dispatch}) => {
        return await doFetch<ICredentials[]>(
            "/login/users",
            dispatch,
        );
    },
);


export const createUser = asyncThunk<void, CreateForm>(
    'login/createUser',
    async ({login, password, ...form}, {dispatch}) => {
        const request = {
            action: "create",
            login,
            password,
            ...form,
        };
        await doFetch<{}>(
            "/login",
            dispatch,
            "POST",
            request,
        );
        dispatch(doLogin({login, password}));
    },
);


export const updateUser = asyncThunk<ICredentials, UpdateForm>(
    'login/updateUser',
    async (form, {dispatch}) => {
        return await doFetch<ICredentials>(
            "/login",
            dispatch,
            "PUT",
            form,
        );
    },
);


export const deleteUsers = asyncThunk<string[], {usernames: string[]}>(
    'login/deleteUsers',
    async (body, {dispatch}) => {
        await doFetch<{}>(
            "/login/users",
            dispatch,
            "DELETE",
            body,
        );
        dispatch(setMessage("Users removed successfully"));
        return body.usernames;
    },
);


export const updateUsers = asyncThunk<IProfilePermissions[], {permissions: IProfilePermissions[]}>(
    'login/updateUsers',
    async (body, {dispatch}) => {
        await doFetch<{}>(
            "/login/users",
            dispatch,
            "PUT",
            body,
        );
        dispatch(setMessage("Users changed successfully"));
        return body.permissions;
    },
);
