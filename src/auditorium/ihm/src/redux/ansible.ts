import {createSlice, PayloadAction} from '@reduxjs/toolkit';


interface AnsibleState {
    pendingActions: {[id: string]: {type: string; arg: unknown;};};
    failedActions: string[];
}


const initialState: AnsibleState = {
    pendingActions: {},
    failedActions: [],
};


const ansibleSlice = createSlice({
    name: "ansible",
    initialState,
    reducers: {
        registerPendingAction: (state, action: PayloadAction<{id: string; type: string; arg: Object;}>) => {
            const {id, type, arg} = action.payload;
            const pendingActions = {...state.pendingActions, [id]: {type, arg}};
            return {...state, pendingActions};
        },
        removePendingAction: (state, action: PayloadAction<string>) => {
            const {[action.payload]: _, ...pendingActions} = state.pendingActions;
            return {...state, pendingActions};
        },
        registerFailed: (state, action: PayloadAction<string>) => {
            const failedActions = [...state.failedActions, action.payload];
            return {...state, failedActions};
        },
        clearFailed: (state) => {
            let pendingActions = state.pendingActions;
            state.failedActions.forEach((id: string) => {
                const {[id]: _, ...rest} = pendingActions;
                pendingActions = rest;
            });
            return {...state, pendingActions, failedActions: []};
        },
    },
});


export const {registerPendingAction, removePendingAction, registerFailed, clearFailed} = ansibleSlice.actions;
export default ansibleSlice.reducer;
