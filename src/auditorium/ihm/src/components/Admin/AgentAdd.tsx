import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';

import FileUpload from '../common/FileUploadButton';

import {addAgent} from '../../api/agents';
import {useDispatch, useSelector} from '../../redux';
import {setMessage} from '../../redux/message';
import type {ICollector} from '../../utils/interfaces';
import type {FieldErrors} from 'react-hook-form';


const TabPanel: React.FC<React.PropsWithChildren<TabProps>> = (props) => {
    const {value, selected, children} = props;
    const hidden = value !== selected;

    return (
        <div role="tabpanel" hidden={hidden}>
            {!hidden && children}
        </div>
    );
};


const AgentAdd: React.FC<Props> = (props) => {
    const collectors = useSelector((state) => state.openbach.collectors);
    const dispatch = useDispatch();
    const {control, handleSubmit, register, reset, formState: {isValid}} = useForm<FormData>({mode: 'onBlur'});
    const [selectedTab, storeTab] = React.useState<TabKeys>('password');

    const handleTabChange = React.useCallback((event: React.SyntheticEvent, value: TabKeys) => {
        storeTab(value);
    }, []);

    const onSubmit = React.useCallback((reattach: boolean) => (data: FormData) => {
        const {name, address, collector, username, password, http_proxy, https_proxy} = data;
        const private_key = data.private_key[0];
        const public_key = data.public_key[0];

        const agent = selectedTab === 'password' ? ({
            name, address, collector_ip: collector,
            username, password,
            http_proxy, https_proxy,
        }) : ({
            name, address, collector_ip: collector,
            username, public_key, private_key,
            http_proxy, https_proxy,
        });
        dispatch(addAgent({reattach, agent}));
        reset();
    }, [dispatch, selectedTab, reset]);

    const onError = React.useCallback((error: FieldErrors<FormData>) => {
        const missing = Object.entries(error).filter(([name, value]) => !value?.message).map(
            ([name, value]) => name.replace(/\b\w/g, (s: string) => s.toUpperCase())
        );
        if (missing.length) {
            dispatch(setMessage("The following fields are missing to create an Agent: " + missing.join(", ")));
        }
    }, [dispatch]);

    const collectorAddresses = React.useMemo(() => {
        if (!collectors) {
            return [];
        }
        return collectors.map((collector: ICollector) => collector.address);
    }, [collectors]);

    if (!collectorAddresses.length) {
        return (
            <React.Fragment>
                <p>No collector found! Cannot add an agent without a collector!</p>
                <p>Please contact your administrator</p>
            </React.Fragment>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit(false), onError)}>
            <fieldset>
                <legend>Connect with</legend>
                <Tabs value={selectedTab} onChange={handleTabChange} centered variant="fullWidth">
                    <Tab label="Password" value="password" />
                    <Tab label="SSH Keys" value="keys" />
                </Tabs>
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
                            fullWidth
                        />
                    )}
                />
                <TabPanel value="password" selected={selectedTab}>
                    <Controller
                        name="password"
                        control={control}
                        rules={{validate: (value) => selectedTab !== "password" || Boolean(value)}}
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
                </TabPanel>
                <TabPanel value="keys" selected={selectedTab}>
                    <FileUpload
                        required
                        label="Public Key"
                        accept=".pub"
                        color="primary"
                        variant="contained"
                        sx={{width: "100%", mt: 2}}
                        name="public_key"
                        register={register}
                        options={{validate: (value) => selectedTab !== "keys" || value?.length > 0}}
                    />
                    <FileUpload
                        required
                        label="Private Key"
                        color="primary"
                        variant="contained"
                        sx={{width: "100%", mt: 2}}
                        name="private_key"
                        register={register}
                        options={{validate: (value) => selectedTab !== "keys" || value?.length > 0}}
                    />
                </TabPanel>
            </fieldset>
            <fieldset>
                <legend>Create Agent</legend>
                <Controller
                    name="name"
                    control={control}
                    rules={{required: true}}
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
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
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            required
                            margin="dense"
                            variant="standard"
                            label="IP Address"
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
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <FormControl fullWidth sx={{mt: 3}}>
                            <InputLabel id="collectors-label-for-add-new">Collector *</InputLabel>
                            <Select
                                required
                                labelId="collectors-label-for-add-new"
                                id="collectors-select-for-add-new"
                                label="Collector *"
                                onChange={onChange}
                                onBlur={onBlur}
                                value={value}
                                inputRef={ref}
                            >
                                {collectorAddresses.map((addr: string) => (
                                    <MenuItem key={addr} value={addr}>
                                        {addr}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />
                <Controller
                    name="http_proxy"
                    control={control}
                    rules={{required: false}}
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            margin="dense"
                            variant="standard"
                            label="HTTP Proxy"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
                <Controller
                    name="https_proxy"
                    control={control}
                    rules={{required: false}}
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            margin="dense"
                            variant="standard"
                            label="HTTPS Proxy"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
            </fieldset>
            <Box textAlign="end">
                <Button
                    variant="contained"
                    color="secondary"
                    disabled={!isValid}
                    type="submit"
                    sx={{m: 2}}
                >
                    Add New Agent
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    disabled={!isValid}
                    onClick={handleSubmit(onSubmit(true), onError)}
                    sx={{m: 2}}
                >
                    Attach Existing Agent
                </Button>
            </Box>
        </form>
    );
};


interface Props {
}


interface FormData {
    username: string;
    password: string;
    private_key: FileList;
    public_key: FileList;
    name: string;
    address: string;
    collector: string;
    http_proxy?: string;
    https_proxy?: string;
}


interface TabProps {
    value: TabKeys;
    selected: TabKeys;
}


type TabKeys = "password" | "keys";
// type FileKeys = "public_key" | "private_key";


export default AgentAdd;
