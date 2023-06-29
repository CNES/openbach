import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';

import Dialog from '../common/ActionDialog';

import {getLogin, doLogin} from '../../api/login';
import {useSelector, useDispatch} from '../../redux';
import {setMessage} from '../../redux/message';
import {closeLoginDialog} from '../../redux/login';
import type {FieldErrors} from 'react-hook-form';


const LoginDialog: React.FC<Props> = (props) => {
    const dispatch = useDispatch();
    const open = useSelector((state) => state.login.showLoginDialog);
    const {control, handleSubmit, reset} = useForm<FormData>();

    const dismissDialog = React.useCallback(() => {
        dispatch(closeLoginDialog());
    }, [dispatch]);

    const onSubmit = React.useCallback((data: FormData) => {
        dispatch(doLogin({login: data.username, password: data.password}));
    }, [dispatch]);

    const onError = React.useCallback((error: FieldErrors<FormData>) => {
        const usernameError = error?.username?.message;
        if (usernameError) {
            dispatch(setMessage(usernameError));
            return;
        }
        const passwordError = error?.password?.message;
        if (passwordError) {
            dispatch(setMessage(passwordError));
            return;
        }
    }, [dispatch]);

    React.useEffect(() => {
        const promise = dispatch(getLogin());
        return () => {
            promise.abort();
        };
    }, [dispatch]);

    React.useEffect(() => {
        if (!open) {reset();}
    }, [open, reset]);

    return (
        <Dialog
            title="Connect As"
            open={open}
            modal
            onSubmit={handleSubmit(onSubmit, onError)}
            cancel={{label: "Stay Anonymous", action: dismissDialog}}
            actions={[{label: "Authenticate", action: "submit"}]}
        >
            <DialogContent>
                <DialogContentText>
                    Please Log In to browse your Projects
                </DialogContentText>
                <Controller
                    name="username"
                    control={control}
                    rules={{required: true}}
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            autoFocus
                            required
                            margin="dense"
                            variant="standard"
                            label="Username"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            autoComplete={open ? undefined : "off"}
                            fullWidth
                        />
                    )}
                />
                <Controller
                    name="password"
                    control={control}
                    rules={{required: true}}
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            required
                            margin="dense"
                            variant="standard"
                            label="Password"
                            type="password"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
            </DialogContent>
        </Dialog>
    );
};


interface Props {
}


interface FormData {
    username: string;
    password: string;
}


export default LoginDialog;
