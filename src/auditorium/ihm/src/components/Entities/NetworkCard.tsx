import React from 'react';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import EntityCardTemplate from './EntityCardTemplate';

import {updateProject, refreshTopology} from '../../api/projects';
import {useDispatch, useSelector} from '../../redux';
import {setMessage} from '../../redux/message';
import type {INetwork} from '../../utils/interfaces';


const image = process.env.PUBLIC_URL + '/assets/cloud.svg';


const NetworkCard: React.FC<Props> = (props) => {
    const {network: {name, address}, onChange} = props;
    const project = useSelector((state) => state.project.current);
    const dispatch = useDispatch();
    const [newName, storeNewName] = React.useState<string>(name);

    const handleNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        storeNewName(event.target.value);
    }, []);

    const handleRename = React.useCallback(() => {
        if (project) {
            dispatch(refreshTopology({project: project.name, newName: {name: newName, address}}));
        }
    }, [project, address, newName, dispatch]);

    const handleHideNetwork = React.useCallback(() => {
        if (project) {
            dispatch(setMessage("Updating Topology, please wait!"));
            const hidden_network = [...project.hidden_network, address];
            dispatch(updateProject({name: project.name, project: {...project, hidden_network}}));
            onChange();
        }
    }, [project, address, dispatch, onChange]);

    return (
        <EntityCardTemplate
            title={name}
            subtitle={address}
            media={image}
            actions={
                <React.Fragment>
                    <Button
                        variant="contained"
                        color="secondary"
                        disabled={!name || name === newName}
                        onClick={handleRename}
                    >
                        Change Name
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleHideNetwork}
                    >
                        Hide Network
                    </Button>
                </React.Fragment>
            }
        >
            <p>Network {address}</p>
            <TextField
                required
                margin="dense"
                variant="standard"
                label="Name"
                value={newName}
                onChange={handleNameChange}
                fullWidth
            />
        </EntityCardTemplate>
    );
};


interface Props {
    network: INetwork;
    onChange: () => void;
}


export default NetworkCard;
