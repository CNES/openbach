import {browserHistory} from "react-router";
import {routerMiddleware} from "react-router-redux";
import {applyMiddleware, compose, createStore} from "redux";
import thunk from "redux-thunk";
import persistState = require("redux-localstorage");

import rootReducer from "../reducers/index";
import promiseMiddleware from "./promise-middleware";

declare const __DEV__: boolean; // from webpack

function configureStore(initialState) {
    const store = compose(
        _getMiddleware(),
        ..._getEnhancers(),
    )(createStore)(rootReducer, initialState);

    _enableHotLoader(store);
    return store;
}

function _getMiddleware() {
    const middleware = [
        routerMiddleware(browserHistory),
        promiseMiddleware,
        thunk,
    ];

    return applyMiddleware(...middleware);
}

const environment: any = window || this;

function _getEnhancers() {
    let enhancers = [
        persistState("session", _persistSessionInLocalStorage()),
    ];

    if (__DEV__ && environment.__REDUX_DEVTOOLS_EXTENSION__) {
        enhancers = [...enhancers, environment.__REDUX_DEVTOOLS_EXTENSION__()];
    }

    return enhancers;
}

function _enableHotLoader(store) {
    if (!__DEV__) {
        return;
    }

    const {hot} = module as any;
    if (hot) {
        hot.accept("../reducers/index", () => {
            const nextRootReducer = require("../reducers/index");
            store.replaceReducer(nextRootReducer);
        });
    }
}

function _persistSessionInLocalStorage() {
    return {
        deserialize: (state) => ({
            session: state ? JSON.parse(state) : {},
        }),
        key: "openbach",
        serialize: (store) => {
            return store && store.session ? JSON.stringify(store.session) : store;
        },
    };
}

export default configureStore;
