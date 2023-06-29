import React from 'react';
import moment from 'moment';

import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import StopIcon from '@mui/icons-material/Stop';
import {red} from '@mui/material/colors';

import ScenarioInstanceIcon from '../common/ScenarioInstanceStatusIcon';

import {getScenarioInstance, stopScenarioInstance} from '../../api/scenarios';
import {useDispatch} from '../../redux';
import type {IScenarioInstance} from '../../utils/interfaces';


const ScenarioInstancesListItem: React.FC<Props> = (props) => {
    const {instance: {status, scenario_instance_id, scenario_name, start_date}, onSelect, checked, onCheck} = props;
    const dispatch = useDispatch();
    const [verbose, storeVerbose] = React.useState<boolean>(false);

    const refresh = React.useCallback(() => {
        dispatch(getScenarioInstance({instance: scenario_instance_id, verbose}));
    }, [scenario_instance_id, verbose, dispatch]);

    const handleClick = React.useCallback(() => {
        storeVerbose(true);
        onSelect(scenario_instance_id);
    }, [scenario_instance_id, onSelect]);

    const handleStop = React.useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        dispatch(stopScenarioInstance({instance: scenario_instance_id}));
    }, [scenario_instance_id, dispatch]);

    const handleSelect = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onCheck(scenario_instance_id, event.target.checked);
    }, [scenario_instance_id, onCheck]);

    React.useEffect(() => {
        if (verbose) {
            refresh();
        }

        if (status === "Running" || status === "Scheduling") {
            const id = setInterval(refresh, verbose ? 5000 : 1500);
            return () => {clearInterval(id);};
        }
    }, [status, verbose, refresh]);

    return (
        <ListItem disablePadding secondaryAction={
            status === "Running" ? (
                <IconButton edge="end" onClick={handleStop}>
                    <StopIcon sx={{color: red[500]}} />
                </IconButton>
            ) : status !== "Scheduling" ? (
                <Checkbox edge="end" disableRipple checked={checked} onChange={handleSelect} />
            ) : undefined
        }>
            <ListItemButton onClick={handleClick}>
                <ListItemIcon>
                    <ScenarioInstanceIcon status={status} />
                </ListItemIcon>
                <ListItemText primary={scenario_name} secondary={moment(start_date).format("YYYY-MM-DD HH:mm:ss")} />
            </ListItemButton>
        </ListItem>
    );
};


interface Props {
    instance: IScenarioInstance;
    checked: boolean;
    onCheck: (id: number, checked: boolean) => void;
    onSelect: (id: number) => void;
}


export default ScenarioInstancesListItem;
