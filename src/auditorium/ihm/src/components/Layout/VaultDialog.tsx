import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';

import Dialog from '../common/ActionDialog';

import {storeVaultPassword} from '../../api/ansible';
import {useSelector, useDispatch} from '../../redux';
import {clearFailed} from '../../redux/ansible';
import {setMessage} from '../../redux/message';
import type {FieldErrors} from 'react-hook-form';


const VaultDialog: React.FC<Props> = (props) => {
    const failed = useSelector((state) => state.ansible.failedActions);
    const dispatch = useDispatch();
    const {control, handleSubmit, reset} = useForm<FormData>();

    const dismissDialog = React.useCallback(() => {
        dispatch(clearFailed());
    }, [dispatch]);

    const onSubmit = React.useCallback(({password}: FormData) => {
        dispatch(storeVaultPassword({password}));
    }, [dispatch]);

    const onError = React.useCallback((error: FieldErrors<FormData>) => {
        const passwordError = error?.password?.message;
        if (passwordError) {
            dispatch(setMessage(passwordError));
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (!failed.length) {reset();}
    }, [failed, reset]);

    return (
        <Dialog
            open={failed.length > 0}
            title="Ansible Vault Password"
            modal
            onSubmit={handleSubmit(onSubmit, onError)}
            cancel={{label: "Abort Request", action: dismissDialog}}
            actions={[{label: "Retry with vault password", action: "submit"}]}
        >
            <DialogContent>
                <DialogContentText>
                    Ansible requires a vault password to process your request.
                </DialogContentText>
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
    password: string;
}


export default VaultDialog;
