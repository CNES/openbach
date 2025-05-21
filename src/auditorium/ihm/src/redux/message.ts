import {createSlice, PayloadAction} from '@reduxjs/toolkit';


interface MessageState {
    message?: string;
    version: string;
    title: string;
}


const initialState: MessageState = {
    title: "Page Not Found",
    version: "Unknown OpenBACH version",
};


const messageSlice = createSlice({
    name: "message",
    initialState,
    reducers: {
        setMessage: (state, action: PayloadAction<string>) => {
            return {
                ...state,
                message: action.payload,
            };
        },
        clearMessage: (state) => {
            const {message: _, ...removedMessage} = state;
            return removedMessage;
        },
        setTitle: (state, action: PayloadAction<string>) => {
            return {
                ...state,
                title: action.payload,
            };
        },
        setVersion: (state, action: PayloadAction<string>) => {
            return {
                ...state,
                version: action.payload,
            };
        },
    },
});


export const {setMessage, clearMessage, setTitle, setVersion} = messageSlice.actions;
export default messageSlice.reducer;
