import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {getLogs} from '../api/global';
import type {ILog} from '../utils/interfaces';


interface LogState {
    logs: ILog[];
    pending: number;
    healthy: boolean;
}


const initialState: LogState = {
    logs: [],
    pending: 0,
    healthy: true,
};


const logsSlice = createSlice({
    name: "logs",
    initialState,
    reducers: {
        markAsSeen: (state) => {
            return {...state, pending: 0};
        },
        markAsRead: (state, action: PayloadAction<string>) => {
            const logs = state.logs.map((l: ILog) => l.id === action.payload ? {...l, checked: true} : l);
            return {...state, logs};
        },
        dismissLog: (state, action: PayloadAction<string>) => {
            const logs = state.logs.filter((l: ILog) => l.id !== action.payload);
            return {...state, logs};
        },
        dismissAll: (state) => {
            return {...state, logs: []};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getLogs.rejected, (state) => {
                return {...state, healthy: false};
            })
            .addCase(getLogs.fulfilled, (state, action) => {
                const newLogs = action.payload.map(([id, timestamp, severity, source, message]) => ({
                    checked: false,
                    id, message, severity, source, timestamp,
                }))
                .filter((l: ILog) => {  // Check if this is necessary as its time complexity is not good
                    for (const oldLog of state.logs) {
                        if (oldLog.id === l.id) {
                            return false;
                        }
                    }
                    return true;
                })
                .sort((a: ILog, b: ILog) => b.timestamp - a.timestamp);
                const pending = state.pending + newLogs.length;
                return {pending, logs: newLogs.concat(state.logs), healthy: true};
            })
    },
});


export const {markAsRead, markAsSeen, dismissLog, dismissAll} = logsSlice.actions;
export default logsSlice.reducer;
