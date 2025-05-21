import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import {installOnAgents, uninstallOnAgents} from '../../api/jobs';
import {useDispatch} from '../../redux';
import {addJobAction} from '../../redux/project';
import type {SelectChangeEvent} from '@mui/material/Select';


const JobActionSelector: React.FC<React.PropsWithChildren<Props>> = (props) => {
    const {options, action, agent} = props;
    const dispatch = useDispatch();
    const [selected, storeSelected] = React.useState<string[]>([]);

    const handleChange = React.useCallback((event: SelectChangeEvent<typeof selected>) => {
        const {value} = event.target;
        storeSelected(typeof value === 'string' ? [] : value);
    }, []);

    const handleAction = React.useCallback(() => {
        if (selected.length) {
            switch (action) {
                case "install":
                    dispatch(installOnAgents({jobNames: selected, agents: [agent]}));
                    break;
                case "uninstall":
                    dispatch(uninstallOnAgents({jobNames: selected, agents: [agent]}));
                    break;
                default:
                    storeSelected([]);
                    return;
            }
            selected.forEach((job: string) => {dispatch(addJobAction({job, agent, action}));});
            setTimeout(() => {
                window.scrollTo({top: document.body.scrollHeight, left: 0, behavior: "smooth"});
            }, 50);
        }
        storeSelected([]);
    }, [selected, action, agent, dispatch]);

    React.useEffect(() => {
        storeSelected([]);
    }, [options]);
    
    return (
        <Box display="flex" alignItems="center" width="100%" gap={1}>
            <Button
                variant="contained"
                color="secondary"
                onClick={handleAction}
            >
                {action} jobs
            </Button>
            <FormControl sx={{flexGrow: 1}}>
                <Select
                    multiple
                    fullWidth
                    value={selected}
                    onChange={handleChange}
                    renderValue={(values) => (
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                            {values.map((value) => (
                                <Chip key={value} label={value} />
                            ))}
                        </Box>
                    )}
                >
                    {options.map((value) => (
                        <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};


interface Props {
    agent: string;
    action: "install" | "uninstall";
    options: string[];
}


export default JobActionSelector;
