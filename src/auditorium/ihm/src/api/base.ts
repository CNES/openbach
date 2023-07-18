import {createAsyncThunk} from '@reduxjs/toolkit'
import type {AsyncThunkPayloadCreator, AsyncThunkOptions} from '@reduxjs/toolkit';

import type {ThunkConfig} from '../redux/';
import {setMessage} from '../redux/message';


export const asyncThunk = <Returned, ThunkArg = void, ExtraThunkConfig = {}>(
    typePrefix: string,
    payloadCreator: AsyncThunkPayloadCreator<Returned, ThunkArg, ThunkConfig & ExtraThunkConfig>,
    options?: AsyncThunkOptions<ThunkArg, ThunkConfig & ExtraThunkConfig>,
) => createAsyncThunk(typePrefix, payloadCreator, options);


declare type Dispatch = Pick<ThunkConfig, "dispatch">["dispatch"];


class RequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RequestError';
    }
}


class AnsibleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AnsibleError';
    }
}


const apiCall = async (route: string, configuration: RequestInit, dispatch: Dispatch): Promise<Response> => {
    try {
        return await fetch(/*encodeURI(route)*/ route, configuration);
    } catch (err) {
        dispatch(setMessage("HTTP Request Error: " + err));
        throw err;
    }
};


export const doFetch = async <T extends unknown>(
        url: string,
        dispatch: Dispatch,
        method: string = "GET",
        body?: object,
): Promise<T> => {
    const configuration: RequestInit = {method, credentials: "same-origin", redirect: "error"};
    if (body) {
        configuration.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
        if (body instanceof File) {
            configuration.body = body;
            configuration.headers['Content-Type'] = body.type;
        } else {
            configuration.body = JSON.stringify(body);
        }
    }

    const response = await apiCall(url, configuration, dispatch);
    if (response.ok) {
        if (response.status === 204) {
            return {} as T;
        }
        return await response.json();
    }

    if (response.status === 460) {
        throw new AnsibleError("Vault password required");
    }

    const msg = "HTTP Request sent back error code: " + response.status + " " + response.statusText;
    try {
        const data = await response.json();
        if ('error' in data) {
            dispatch(setMessage("Error while processing the request: " + data.error));
        } else {
            dispatch(setMessage(msg));
        }
    } catch (e) {
        dispatch(setMessage(msg));
    }
    throw new RequestError(msg);
};


export const downloadURL = (route: string, downloadName?: string, contentType?: string) => {
    const a = document.createElement("A") as HTMLAnchorElement;
    if (downloadName) {
        a.download = downloadName;

        if (contentType) {
            // `route` is actually some data, convert it to Blob URL first
            // See https://stackoverflow.com/a/16762555/5069029 for rationale
            const blob = new Blob([route], {type: contentType});
            a.href = URL.createObjectURL(blob);
        } else {
            a.href = encodeURI(route);
        }
    } else {
        a.href = encodeURI(route);
    }
    a.target = "_blank";
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent("click"));
    document.body.removeChild(a);
};
