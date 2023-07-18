import {configureStore, createListenerMiddleware} from '@reduxjs/toolkit';
import {useDispatch as useReduxDispatch, useSelector as useReduxSelector} from 'react-redux';
import type {TypedUseSelectorHook} from 'react-redux';

import ansibleReducer from './ansible';
import formReducer from './form';
import loginReducer from './login';
import logsReducer from './logs';
import messageReducer from './message';
import openbachReducer from './openbach';
import projectReducer from './project';
import usersReducer from './users';


export const listener = createListenerMiddleware();


const store = configureStore({
    reducer: {
        ansible: ansibleReducer,
        form: formReducer,
        global: messageReducer,
        login: loginReducer,
        logs: logsReducer,
        openbach: openbachReducer,
        project: projectReducer,
        users: usersReducer,
    },
    middleware: (getDefaultMiddlewares) => getDefaultMiddlewares().prepend(listener.middleware),
    devTools: process.env.NODE_ENV === "development",
});


declare type Store = ReturnType<typeof store.getState>;
declare type Dispatch = typeof store.dispatch;
export interface ThunkConfig {
    state: Store;
    dispatch: Dispatch;
}


export const useDispatch = () => useReduxDispatch<Dispatch>();
export const useSelector: TypedUseSelectorHook<Store> = useReduxSelector;


export default store;
