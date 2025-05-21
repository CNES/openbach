import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import ImageListItem from '@mui/material/ImageListItem';
import InputLabel from '@mui/material/InputLabel';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import {useTheme} from '@mui/material/styles';

import ListItemButton from '../common/NestedListItem';

import {listAgents, addInternalJob, addExternalJob} from '../../api/jobs';
import {useDispatch, useSelector} from '../../redux';
import type {IAgent, IJob, IExternalJobInfos} from '../../utils/interfaces';
import type {SelectChangeEvent} from '@mui/material/Select';


const chipLabel = (address: string, agents?: IAgent[]) => {
    const agent = agents?.find((a: IAgent) => a.address === address);
    if (!agent) {
        return address;
    }

    return `${agent.name} (${agent.address})`;
};


const JobsListItem: React.FC<Props> = (props) => {
    const {job, update, isCore, onUpdate} = props;
    const {name, keywords, job_version, description} = job.general;
    const theme = useTheme();
    const dispatch = useDispatch();
    const allAgents = useSelector((state) => state.openbach.agents);
    const [agents, storeAgents] = React.useState<string[]>([]);
    const [initialAgents, storeInitialAgents] = React.useState<{[key: string]: string;}>({});

    const handleChange = React.useCallback((event: SelectChangeEvent<typeof agents>) => {
        const {value} = event.target;
        storeAgents(typeof value === 'string' ? [] : value);
    }, []);

    const handleUpdate = React.useCallback(() => {
        if (isCore) {
            dispatch(addInternalJob({name}));
        } else {
            dispatch(addExternalJob({name}));
        }
    }, [dispatch, isCore, name]);

    const handleInstall = React.useCallback(() => {
        const update = agents.filter((address: string) => initialAgents.hasOwnProperty(address));
        const install = agents.filter((address: string) => !initialAgents.hasOwnProperty(address));
        const remove = Object.keys(initialAgents).filter((address: string) => !agents.includes(address));
        onUpdate({name, install, remove, update});
    }, [name, agents, initialAgents, onUpdate]);

    React.useEffect(() => {
        const promise = dispatch(listAgents({jobName: name}))
        promise.unwrap().then(({installed_on}) => {
            storeInitialAgents(Object.fromEntries(installed_on.map((info) => (
                [info.agent__address, info.agent__name]
            ))));
            storeAgents(installed_on.map((info) => info.agent__address));
        });
        return () => {promise.abort();};
    }, [dispatch, name]);

    const {fontWeightMedium, fontWeightRegular} = theme.typography;
    const availableVersion = update?.version;
    const versionText = availableVersion === job_version
        ? "This is the lattest version available"
        : `Update to version ${availableVersion}`;

    return (
            <ImageListItem>
                <ListItemButton
                    primary={name}
                    secondary={"Keywords: " + keywords.join(", ")}
                    nestedItems={
                        <React.Fragment>
                            <ListItem>
                                <ListItemText
                                    primary={"Version: " + job_version}
                                    secondary={availableVersion && versionText}
                                />
                            </ListItem>
                            {availableVersion && availableVersion !== job_version && (<ListItem>
                                <ListItemText inset sx={{textAlign: "end"}}>
                                    <Button color="secondary" variant="contained" onClick={handleUpdate}>
                                        {versionText}
                                    </Button>
                                </ListItemText>
                            </ListItem>)}
                            <ListItem>
                                <ListItemText primary="Description" />
                            </ListItem>
                            <ListItem>
                                <ListItemText inset primary={description} />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Installed on" />
                            </ListItem>
                            <ListItem>
                                <ListItemText inset>
                                    <FormControl fullWidth sx={{ m: 1, width: 300 }}>
                                        <InputLabel id={`${name}-multiple-chip-label`}>Agents</InputLabel>
                                        <Select
                                            labelId={`${name}-multiple-chip-label`}
                                            id={`${name}-multiple-chip-select`}
                                            label="Agents"
                                            multiple
                                            fullWidth
                                            value={agents}
                                            onChange={handleChange}
                                            renderValue={(selected) => (
                                                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                                    {selected.map((value) => (
                                                        <Chip key={value} label={chipLabel(value, allAgents)} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {allAgents?.map(({name, address}) => (
                                                <MenuItem
                                                  key={name}
                                                  value={address}
                                                  sx={{fontWeight: agents.indexOf(address) === -1 ? fontWeightRegular : fontWeightMedium}}
                                                >
                                                    {name} ({address})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </ListItemText>
                            </ListItem>
                            <ListItem>
                                <ListItemText inset sx={{textAlign: "end"}}>
                                    <Button color="secondary" variant="contained" onClick={handleInstall}>
                                        Update
                                    </Button>
                                </ListItemText>
                            </ListItem>
                        </React.Fragment>
                    }
                />
            </ImageListItem>
    );
};


interface Props {
    job: IJob;
    update?: IExternalJobInfos;
    isCore: boolean;
    onUpdate: (update: JobUpdater) => void;
}


interface JobUpdater {
    name: string;
    install: string[];
    remove: string[];
    update: string[];
}


export default JobsListItem;
