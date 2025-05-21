import React from 'react';

import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import ProjectsListItem from './ProjectsListItem';
import Dialog from '../common/ActionDialog';
import ListItemButton from '../common/NestedListItem';

import {deleteProject} from '../../api/projects';
import {useDispatch, useSelector} from '../../redux';
import {IProject} from '../../utils/interfaces';


const ProjectsList: React.FC<Props> = (props) => {
    const projects = useSelector((state) => state.openbach.projects);
    const username = useSelector((state) => state.login.username);
    const dispatch = useDispatch();
    const [projectToDelete, storeProjectToDelete] = React.useState<string>();

    const handleOpen = React.useCallback((name: string) => {
        storeProjectToDelete(name);
    }, []);

    const handleClose = React.useCallback(() => {
        storeProjectToDelete(undefined);
    }, []);

    const handleDelete = React.useCallback(() => {
        if (projectToDelete) {
            dispatch(deleteProject({name: projectToDelete}));
        }
        handleClose();
    }, [projectToDelete, handleClose, dispatch]);

    const buildProjects = React.useCallback((predicate: Predicate) => {
        if (!projects) {
            return [];
        }
        return projects.filter(predicate).map((project: IProject) => (
            <ProjectsListItem key={project.name} project={project} onDelete={handleOpen} />
        ));
    }, [projects, handleOpen]);

    if (!projects) {
        return (
            <List>
                <ListItem>
                    <ListItemText primary="Fetching projects..." secondary="Please wait" />
                </ListItem>
            </List>
        );
    }

    if (!projects.length) {
        return (
            <List>
                <ListItem>
                    <ListItemText primary="No project yet..." secondary="Please add a new project" />
                </ListItem>
            </List>
        );
    }
    
    const privateProjects = buildProjects((p: IProject) => p.owners.indexOf(username!) >= 0);
    const ownedProjects = buildProjects((p: IProject) => p.owners.length !== 0 && p.owners.indexOf(username!) < 0);
    const publicProjects = buildProjects((p: IProject) => p.owners.length === 0);

    return (
        <React.Fragment>
            <List>
                {privateProjects.length > 0 && (
                    <ListItemButton
                        primary="Private Projects"
                        initiallyOpen
                        nestedItems={privateProjects}
                    />
                )}
                {ownedProjects.length > 0 && (
                    <ListItemButton
                        primary="Owned Projects"
                        nestedItems={ownedProjects}
                    />
                )}
                {publicProjects.length > 0 && (
                    <ListItemButton
                        primary="Public Projects"
                        nestedItems={publicProjects}
                    />
                )}
            </List>
            <Dialog
                title="Delete project?"
                open={Boolean(projectToDelete)}
                cancel={{label: "Cancel", action: handleClose}}
                actions={[{label: "Delete", action: handleDelete}]}
            >
                <DialogContent>
                    <DialogContentText>
                        Deleting the project "{projectToDelete}" is irreversible!
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
};


interface Props {
}


type Predicate = (p: IProject) => boolean;


export default ProjectsList;
