import React from 'react';
import {Link} from 'react-router-dom';

import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';

import Delete from '../common/DeleteIcon';
import LaunchScenario from '../common/LaunchScenarioIcon';

import {useSelector} from '../../redux';
import {IScenario} from '../../utils/interfaces';


const ScenariosListItem: React.FC<Props> = (props) => {
    const {scenario: {name, openbach_functions, arguments: args}, onDelete, onLaunch} = props;
    const project = useSelector((state) => state.project.current);

    const handleStartScenario = React.useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onLaunch({scenario: name, args: Object.keys(args)});
    }, [name, args, onLaunch]);

    const handleDelete = React.useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onDelete(name);
    }, [onDelete, name]);

    const length = openbach_functions.length;
    const secondary = `${length} openbach function${length > 1 ? "s" : ""}`;

    return (
        <ListItemButton component={Link} to={`/app/project/${project?.name}/scenario/${name}`} disableRipple>
            <ListItemIcon onClick={handleStartScenario}>
                <LaunchScenario />
            </ListItemIcon>
            <ListItemText primary={name} secondary={secondary} />
            <ListItemSecondaryAction>
                <IconButton edge="end" onClick={handleDelete}>
                    <Delete />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItemButton>
    );
};


interface Props {
    scenario: IScenario;
    onLaunch: (scenario: {scenario: string; args: string[];}) => void;
    onDelete: (name: string) => void;
}


export default ScenariosListItem;
