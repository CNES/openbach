import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';

import Dialog from '../common/ActionDialog';

import {createUser} from '../../api/login';
import {useDispatch} from '../../redux';
import {setMessage} from '../../redux/message';
import type {FieldErrors} from 'react-hook-form';


const CreateUserDialog: React.FC<Props> = (props) => {
    const {open, onClose} = props;
    const dispatch = useDispatch();
    const {control, handleSubmit, reset} = useForm<FormData>();

    const onSubmit = React.useCallback((data: FormData) => {
        dispatch(createUser({
            login: data.username,
            password: data.password,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
        }));
    }, [dispatch]);

    const onError = React.useCallback((error: FieldErrors<FormData>) => {
        const loginError = error?.username?.message;
        if (loginError) {
            dispatch(setMessage(loginError));
            return;
        }
        const passwordError = error?.password?.message;
        if (passwordError) {
            dispatch(setMessage(passwordError));
            return;
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (!open) {reset();}
    }, [open, reset]);

    return (
        <Dialog
            title="Create New User"
            open={open}
            onSubmit={handleSubmit(onSubmit, onError)}
            cancel={{label: "Cancel", action: onClose}}
            actions={[{label: "Create User", action: "submit"}]}
        >
            <DialogContent>
                <DialogContentText>
                    Required Fields
                </DialogContentText>
                <Controller
                    name="username"
                    control={control}
                    rules={{required: true}}
                    defaultValue=""
                    render={({field: {onBlur, onChange, value, ref}}) => (
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
                            fullWidth
                        />
                    )}
                />
                <Controller
                    name="password"
                    control={control}
                    rules={{required: true}}
                    defaultValue=""
                    render={({field: {onBlur, onChange, value, ref}}) => (
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
                <DialogContentText>
                    Optional Fields
                </DialogContentText>
                <Controller
                    name="email"
                    control={control}
                    rules={{required: false}}
                    defaultValue=""
                    render={({field: {onBlur, onChange, value, ref}}) => (
                        <TextField
                            margin="dense"
                            variant="standard"
                            label="Email"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
                <Controller
                    name="firstName"
                    control={control}
                    rules={{required: false}}
                    defaultValue=""
                    render={({field: {onBlur, onChange, value, ref}}) => (
                        <TextField
                            margin="dense"
                            variant="standard"
                            label="First Name"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
                <Controller
                    name="lastName"
                    control={control}
                    rules={{required: false}}
                    defaultValue=""
                    render={({field: {onBlur, onChange, value, ref}}) => (
                        <TextField
                            margin="dense"
                            variant="standard"
                            label="Last Name"
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
    open: boolean;
    onClose: () => void;
}


interface FormData {
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}


export default CreateUserDialog;
