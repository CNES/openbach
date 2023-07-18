import {createSlice} from '@reduxjs/toolkit';

import {getUsers, deleteUsers, updateUsers} from '../api/login';
import type {ICredentials} from '../utils/interfaces';


interface UsersState {
    users: ICredentials[];
}


const initialState: UsersState = {
    users: [],
}


const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            .addCase(getUsers.fulfilled, (state, action) => {
                return {users: action.payload};
            })
            .addCase(getUsers.rejected, (state) => {
                return {...initialState};
            })
            .addCase(deleteUsers.fulfilled, (state, action) => {
                const users = state.users.filter((u: ICredentials) => !action.payload.includes(u.username));
                return {users};
            })
            .addCase(updateUsers.fulfilled, (state, action) => {
                const users = state.users.map((u: ICredentials) => {
                    const update = action.payload.find((permission) => permission.login === u.username);
                    return update ? {...u, is_user: update.active, is_admin: update.admin} : u;
                });
                return {users};
            })
    },
});


// export const {} = usersSlice.actions;
export default usersSlice.reducer;
