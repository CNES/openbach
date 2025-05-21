import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';

import Dialog from '../common/ActionDialog';

import {updateAgent} from '../../api/agents';
import {useDispatch, useSelector} from '../../redux';
import {setMessage} from '../../redux/message';
import type {ICollector} from '../../utils/interfaces';
import type {FieldErrors} from 'react-hook-form';


const AgentUpdate: React.FC<Props> = (props) => {
    const {open, onClose, initialValues} = props;
    const collectors = useSelector((state) => state.openbach.collectors);
    const dispatch = useDispatch();
    const {control, handleSubmit, reset} = useForm<FormData>({defaultValues: initialValues});

    const collectorAddresses = React.useMemo(() => {
        if (!collectors) {
            return [initialValues.collector];
        }

        const addresses = collectors.map((collector: ICollector) => collector.address);
        if (initialValues.collector && !addresses.includes(initialValues.collector)) {
            addresses.push(initialValues.collector);
        }
        return addresses;
    }, [initialValues.collector, collectors]);

    const onSubmit = React.useCallback((data: FormData) => {
        const {name, address, collector} = initialValues;
        if (name === data.name && address === data.address && collector === data.collector) {
            dispatch(setMessage("No changes made to the agent; will not update"));
        } else {
            dispatch(updateAgent({
                address,
                agent: {
                    name: data.name,
                    agent_ip: data.address,
                    collector_ip: data.collector,
                },
            }));
        }
        onClose();
    }, [initialValues, onClose, dispatch]);

    const onError = React.useCallback((error: FieldErrors<FormData>) => {
        const missing = Object.entries(error).filter(([name, value]) => !value?.message).map(
            ([name, value]) => name.replace(/\b\w/g, (s: string) => s.toUpperCase())
        );
        if (missing.length) {
            dispatch(setMessage("The following fields are missing to update an Agent: " + missing.join(", ")));
        }
    }, [dispatch]);

    const handleClose = React.useCallback(() => {
        reset(initialValues);
        onClose();
    }, [initialValues, reset, onClose]);

    return (
        <Dialog
            title="Update an Agent"
            open={open}
            onSubmit={handleSubmit(onSubmit, onError)}
            cancel={{label: "Cancel", action: handleClose}}
            actions={[{label: "OK", action: "submit"}]}
        >
            <DialogContent>
                <Controller
                    name="name"
                    control={control}
                    rules={{required: true}}
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            autoFocus
                            required
                            margin="dense"
                            variant="standard"
                            label="Name"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
                <Controller
                    name="address"
                    control={control}
                    rules={{required: true}}
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            required
                            margin="dense"
                            variant="standard"
                            label="Address"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
                <Controller
                    name="collector"
                    control={control}
                    rules={{required: true}}
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <FormControl fullWidth sx={{mt: 2}}>
                            <InputLabel id={`collectors-label-for-${initialValues.name}`}>Collector</InputLabel>
                            <Select
                                labelId={`collectors-label-for-${initialValues.name}`}
                                id={`collectors-select-for-${initialValues.name}`}
                                label="Collector"
                                onChange={onChange}
                                onBlur={onBlur}
                                value={value}
                                inputRef={ref}
                            >
                                {collectorAddresses.map((addr: string) => <MenuItem key={addr} value={addr}>{addr}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                />
            </DialogContent>
        </Dialog>
    );
};


interface Props {
    open: boolean;
    initialValues: FormData;
    onClose: () => void;
}


interface FormData {
    name: string;
    address: string;
    collector: string;
}


export default AgentUpdate;
