import React from 'react';
import {Link} from 'react-router-dom';

import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

import DeleteIcon from '../common/DeleteIcon';
import DownloadIcon from '../common/DownloadIcon';

import {downloadURL} from '../../api/base';
import {IProject} from '../../utils/interfaces';


const shorten = (description: string) => {
    const lineFeed = description.indexOf('\n');
    return lineFeed < 0 ? description : description.substr(0, lineFeed);
};


const ProjectsListItem: React.FC<Props> = (props) => {
    const {project: {name, description}, onDelete} = props;

    const handleDownload = React.useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        downloadURL(`/openbach/project/${name}/`, `${name}.json`);
    }, [name]);

    const handleDelete = React.useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onDelete(name);
    }, [onDelete, name]);

    return (
        <ListItemButton component={Link} to={`/app/project/${name}`} disableRipple>
            <ListItemIcon onClick={handleDownload}>
                <DownloadIcon title="Download Project" />
            </ListItemIcon>
            <ListItemText primary={name} secondary={shorten(description)} />
            <ListItemSecondaryAction>
                <IconButton edge="end" onClick={handleDelete}>
                    <DeleteIcon />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItemButton>
    );
};


interface Props {
    project: IProject;
    onDelete: (name: string) => void;
}


export default ProjectsListItem;
