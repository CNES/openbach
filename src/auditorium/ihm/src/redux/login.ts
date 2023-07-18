import {createSlice} from '@reduxjs/toolkit';

import {getLogin, doLogin, doLogout, updateUser} from '../api/login';
import {favoriteScenario} from '../api/scenarios';
import type {ICredentials} from '../utils/interfaces';


type BaseLoginState = Partial<ICredentials> & Pick<ICredentials, "favorites" | "is_admin" | "is_user">;
interface LoginState extends BaseLoginState {
    showLoginDialog: boolean;
}


const initialState: LoginState = {
    favorites: {},
    is_admin: false,
    is_user: false,
    showLoginDialog: true,
};


const loginSlice = createSlice({
    name: "login",
    initialState,
    reducers: {
        openLoginDialog: (state) => {
            return {...state, showLoginDialog: true};
        },
        closeLoginDialog: (state) => {
            return {...state, showLoginDialog: false};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getLogin.fulfilled, (state, action) => {
                const authenticated = Boolean(action.payload.username);
                return {...action.payload, showLoginDialog: !authenticated};
            })
            .addCase(doLogin.fulfilled, (state, action) => {
                return {...action.payload, showLoginDialog: false};
            })
            .addCase(doLogout.fulfilled, (state, action) => {
                return {...initialState, showLoginDialog: true};
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                return {...action.payload, showLoginDialog: state.showLoginDialog};
            })
            .addCase(favoriteScenario.fulfilled, (state, action) => {
                return {...action.payload, showLoginDialog: state.showLoginDialog};
            });
    },
});


export const {openLoginDialog, closeLoginDialog} = loginSlice.actions;
export default loginSlice.reducer;
