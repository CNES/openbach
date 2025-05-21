import React from 'react';

import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';

import EntityCardTemplate from './EntityCardTemplate';

import {addEntity} from '../../api/entities';
import {useDispatch, useSelector} from '../../redux';
import type {IAgent} from '../../utils/interfaces';
import type {SelectChangeEvent} from '@mui/material/Select';


const image = process.env.PUBLIC_URL + '/assets/project.svg';


const EntityAdd: React.FC<Props> = (props) => {
    const {project} = props;
    const isUser = useSelector((state) => state.login.is_user);
    const agents = useSelector((state) => state.openbach.agents);
    const dispatch = useDispatch();
    const [newEntityName, storeNewEntityName] = React.useState<string>("");
    const [newEntityDescription, storeNewEntityDescription] = React.useState<string>("");
    const [newEntityAgent, storeNewEntityAgent] = React.useState<string>("");

    const handleNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        storeNewEntityName(event.target.value);
    }, []);

    const handleDescriptionChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        storeNewEntityDescription(event.target.value);
    }, []);

    const handleAgentChange = React.useCallback((event: SelectChangeEvent) => {
        const {value} = event.target;
        storeNewEntityAgent(value ? value : "");
    }, []);

    const handleEntityAdd = React.useCallback(() => {
        if (!newEntityName) {
            return;
        }

        dispatch(addEntity({
            project,
            name: newEntityName,
            description: newEntityDescription || undefined,
            agent: agents?.find((a: IAgent) => a.address === newEntityAgent),
        }));
        storeNewEntityName("");
        storeNewEntityDescription("");
        storeNewEntityAgent("");
    }, [project, agents, newEntityName, newEntityDescription, newEntityAgent, dispatch]);

    const reserved = React.useMemo(() => (agents || []).filter(
        (agent: IAgent) => !agent.project && agent.reserved === project
    ).map((agent: IAgent) => (
        <MenuItem key={agent.address} value={agent.address}>{agent.name}</MenuItem>
    )), [agents, project]);

    const available = React.useMemo(() => (agents || []).filter(
        (agent: IAgent) => !agent.project && !agent.reserved
    ).map((agent: IAgent) => (
        <MenuItem key={agent.address} value={agent.address}>{agent.name}</MenuItem>
    )), [agents]);

    if (!isUser) {
        return (
            <EntityCardTemplate
                title="Entity"
                subtitle="Click on an entity to select it"
                media={image}
            >
                No entity selected
            </EntityCardTemplate>
        );
    }

    return (
        <EntityCardTemplate
            title="Add Entity"
            subtitle="Create a new Entity for an Agent"
            media={image}
            actions={
                <Button
                    variant="contained"
                    color="secondary"
                    disabled={!newEntityName}
                    onClick={handleEntityAdd}
                >
                    Add Entity
                </Button>
            }
        >
            <TextField
                required
                margin="dense"
                variant="standard"
                label="Entity Name"
                value={newEntityName}
                onChange={handleNameChange}
                fullWidth
            />
            <TextField
                margin="dense"
                variant="standard"
                label="Entity Description"
                value={newEntityDescription}
                onChange={handleDescriptionChange}
                fullWidth
                multiline
                rows={3}
            />
            <FormControl fullWidth sx={{mt: 3}}>
                <InputLabel id="entity-add-label">Associated Agent</InputLabel>
                <Select
                    required
                    labelId="entity-add-label"
                    id="entity-add-select"
                    label="Associated Agent"
                    value={newEntityAgent}
                    onChange={handleAgentChange}
                >
                    <MenuItem value="" />
                    <MenuItem>--- Agents reserved for this project ---</MenuItem>
                    {reserved}
                    <MenuItem>--- Free Agents ---</MenuItem>
                    {available}
                </Select>
            </FormControl>
        </EntityCardTemplate>
    );
};


interface Props {
    project: string;
}


export default EntityAdd;
