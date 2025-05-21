import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';

import {grey, red} from '@mui/material/colors';

import {updateUser} from '../../api/login';
import {useSelector, useDispatch} from '../../redux';
import {setMessage, setTitle} from '../../redux/message';
import type {FieldErrors} from 'react-hook-form';


const fieldsEqual = (originalValue?: string, fieldValue?: string): boolean => {
    return !originalValue && !fieldValue ? true : originalValue === fieldValue;
};


const Settings: React.FC<Props> = (props) => {
    const {username, first_name, last_name, email, is_user} = useSelector((state) => state.login);
    const dispatch = useDispatch();
    const {control, handleSubmit, reset, formState: {isDirty}} = useForm<FormData>();

    const onSubmit = React.useCallback((data: FormData) => {
        if (username) {
            dispatch(updateUser({
                login: username,
                password: data.password || undefined,
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
            }));
            reset({password: "", passwordVerif: ""});
        }
    }, [username, reset, dispatch]);

    const onError = React.useCallback((error: FieldErrors<FormData>) => {
        const errors: string[] = [];
        const passwordError = error?.password?.message;
        if (passwordError) {
            errors.push(passwordError);
        }
        const firstNameError = error?.firstName?.message;
        if (firstNameError) {
            errors.push("First Name " + firstNameError);
        }
        const lastNameError = error?.lastName?.message;
        if (lastNameError) {
            errors.push("Last Name " + lastNameError);
        }
        if (errors.length) {
            dispatch(setMessage(errors.join(" / ")));
        }
    }, [dispatch]);

    React.useEffect(() => {
        dispatch(setTitle("Settings"));
    }, [dispatch]);

    const name = [first_name, last_name].join(" ").trim();
    const title = name ? `User settings for ${username} (${name})` : "User settings for " + username;

    return (
        <React.Fragment>
            <h1>{title}</h1>
            {!is_user && <Box component="p" color={red[500]}>
                Your account is not activated yet, please contact your administrator
            </Box>}
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <Divider>Profile</Divider>
                <Controller
                    name="firstName"
                    control={control}
                    rules={{required: false, maxLength: {value: 30, message: "Length is limited to 30 characters"}}}
                    defaultValue={first_name || ""}
                    render={({field: {onBlur, onChange, value, ref}, fieldState: {error}}) => (
                        <TextField
                            fullWidth
                            variant="standard"
                            label="First Name"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            error={!!error?.message}
                            helperText={error?.message}
                        />
                    )}
                />
                <Controller
                    name="lastName"
                    control={control}
                    rules={{required: false, maxLength: {value: 30, message: "Length is limited to 30 characters"}}}
                    defaultValue={last_name || ""}
                    render={({field: {onBlur, onChange, value, ref}, fieldState: {error}}) => (
                        <TextField
                            fullWidth
                            variant="standard"
                            label="Last Name"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            error={!!error?.message}
                            helperText={error?.message}
                        />
                    )}
                />
                <Controller
                    name="email"
                    control={control}
                    rules={{required: false}}
                    defaultValue={email || ""}
                    render={({field: {onBlur, onChange, value, ref}}) => (
                        <TextField
                            fullWidth
                            variant="standard"
                            label="Email"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                        />
                    )}
                />
                <Divider sx={{mt: 5}}>Change Password</Divider>
                <Box component="p" color={grey[500]}>
                    Fill in the following fields only if you want to change your password
                </Box>
                <Controller
                    name="password"
                    control={control}
                    rules={{required: false, validate: (_, values) => fieldsEqual(values.password, values.passwordVerif) || "The two passwords do not match"}}
                    defaultValue=""
                    render={({field: {onBlur, onChange, value, ref}, fieldState: {error}}) => (
                        <TextField
                            fullWidth
                            variant="standard"
                            type="password"
                            label="Password"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            error={!!error?.message}
                            helperText={error?.message}
                        />
                    )}
                />
                <Controller
                    name="passwordVerif"
                    control={control}
                    rules={{required: false, validate: (_, values) => fieldsEqual(values.password, values.passwordVerif) || "The two passwords do not match"}}
                    defaultValue=""
                    render={({field: {onBlur, onChange, value, ref}, fieldState: {error}}) => (
                        <TextField
                            fullWidth
                            variant="standard"
                            type="password"
                            label="Confirm Password"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            error={!!error?.message}
                            helperText={error?.message}
                        />
                    )}
                />
                <Button variant="contained" color="secondary" disabled={!isDirty} type="submit" sx={{mt: 5}}>
                    Modify User Settings
                </Button>
            </form>
        </React.Fragment>
    );
};


interface Props {
}


interface FormData {
    password?: string;
    passwordVerif?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}


export default Settings;
