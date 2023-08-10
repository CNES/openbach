import React from 'react';
import {useNavigate} from 'react-router';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import Dialog from '../common/ActionDialog';
import DownloadButton from '../common/DownloadButton';
import JsonEditor from '../common/JsonEditor';
import Topology from '../common/Topology';
import Entity from '../Entities/EntityManager';
import JobsStatusesInfos from '../Entities/JobsStatusesInfos';
import Select from './ProjectMiscellaneousSelect';

import {getAgents} from '../../api/agents';
import {deleteProject, updateProject, refreshTopology} from '../../api/projects';
import {useDispatch, useSelector} from '../../redux';
import {setMessage} from '../../redux/message';
import type {IProject, IEntity, INetwork} from '../../utils/interfaces';
import type {TopologyNode, TopologyLink} from '../common/Topology';


const miscellaneousStyle = {margin: "0 15px 10px"};


const ProjectDetails: React.FC<Props> = (props) => {
    const project = useSelector((state) => state.project.current);
    const isAdmin = useSelector((state) => state.login.is_admin);
    const isUser = useSelector((state) => state.login.is_user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [open, storeOpen] = React.useState<boolean>(false);
    const [selectedEntity, storeSelectedEntity] = React.useState<IEntity>();
    const [selectedNetwork, storeSelectedNetwork] = React.useState<INetwork>();

    const handleOpen = React.useCallback(() => {
        storeOpen(true);
    }, []);

    const handleClose = React.useCallback(() => {
        storeOpen(false);
    }, []);

    const handleUnselect = React.useCallback(() => {
        storeSelectedEntity(undefined);
        storeSelectedNetwork(undefined);
    }, []);

    const handleSelect = React.useCallback((node: TopologyNode) => {
        if (project) {
            if (node.type === "network") {
                storeSelectedEntity(undefined);
                storeSelectedNetwork(project.network.find((network: INetwork) => network.address === node.id));
            } else if (node.type === "entity") {
                storeSelectedEntity(project.entity.find((entity: IEntity) => entity.name === node.id));
                storeSelectedNetwork(undefined);
            } else {
                storeSelectedEntity(undefined);
                storeSelectedNetwork(undefined);
            }
        }
    }, [project]);

    const handleFetchNtp = React.useCallback(() => {
        dispatch(setMessage("Fetching Agents statusses. Please wait..."));
        dispatch(getAgents({services: true}));
    }, [dispatch]);

    const handleUpdateOwners = React.useCallback((owners: string[]) => {
        if (project) {
            dispatch(updateProject({name: project.name, project: {...project, owners}}));
        }
    }, [project, dispatch]);

    const handleShowNetworks = React.useCallback((showNetworks: string[]) => {
        if (project) {
            const hidden_network = project.hidden_network.filter(
                (name: string) => !showNetworks.includes(name)
            );
            dispatch(setMessage("Updating Topology, please wait!"));
            dispatch(updateProject({name: project.name, project: {...project, hidden_network}}));
        }
    }, [project, dispatch]);

    const handleRefreshTopology = React.useCallback(() => {
        if (project) {
            dispatch(refreshTopology({project: project.name}));
        }
    }, [project, dispatch]);

    const handleProjectUpdate = React.useCallback((json: string) => {
        if (project) {
            const update = JSON.parse(json) as IProject;
            dispatch(updateProject({name: project.name, project: update}));
        }
    }, [project, dispatch]);

    const handleDeleteProject = React.useCallback(() => {
        if (project) {
            dispatch(deleteProject({name: project.name})).unwrap().then(() => navigate('/app'));
        }
        handleClose();
    }, [project, handleClose, dispatch, navigate]);

    const [links, nodes] = React.useMemo(() => {
        const projectLinks: TopologyLink[] = [];
        if (!project) {
            return [projectLinks, []];
        }

        const networkNodes: TopologyNode[] = project.network.map((network: INetwork) => ({
            name: network.name,
            id: network.address,
            type: "network",
            color: network.address.startsWith("imported:") ? "tomato" : undefined,
        }));
        
        const entityNodes: TopologyNode[] = project.entity.map((entity: IEntity) => {
            const node: TopologyNode = {
                name: entity.name,
                id: entity.name,
                type: "entity",
                color: entity.agent ? "green" : "black",
            };
            entity.networks?.forEach((network: INetwork) => {
                const target = networkNodes.find((n) => n.id === network.address);
                if (target) {projectLinks.push({source: node, target, weight: 3});}
            });
            return node;
        });

        return [projectLinks, entityNodes.concat(networkNodes)];
    }, [project]);

    if (!project) {
        return null;
    }

    const canRestricted = isAdmin || (!project.owners?.length && isUser);
    const users = [...project.owners];

    return (
        <React.Fragment>
            <h1>Project '{project.name}'</h1>
            <Box mb="8px" pb="8px">
                {project.description.split("\n").map((line: string, index: number) => (
                    <p key={index}>{line}</p>
                ))}
            </Box>
            <Select
                title="Project Owners"
                label="Share"
                initial={project.owners}
                options={users}
                canDoAction={canRestricted}
                onAction={handleUpdateOwners}
            />
            <Select
                title="Hidden Networks"
                label="Show"
                initial={project.hidden_network}
                options={project.hidden_network}
                canDoAction={isUser}
                onAction={handleShowNetworks}
            />
            <Box display="flex" alignItems="center" justifyContent="center">
                <Button
                    variant="contained"
                    color="secondary"
                    disabled={!isUser}
                    onClick={handleRefreshTopology}
                    sx={miscellaneousStyle}
                >
                    Refresh Topology
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    disabled={!isUser}
                    onClick={handleFetchNtp}
                    sx={miscellaneousStyle}
                >
                    Fetch NTP Offset
                </Button>
                <DownloadButton
                    route={`/openbach/project/${project.name}`}
                    filename={`${project.name}.json`}
                    label="Project"
                    sx={miscellaneousStyle}
                />
                <JsonEditor
                    label="Project"
                    initial={project}
                    onUpdate={handleProjectUpdate}
                    disabled={!isUser}
                    sx={miscellaneousStyle}
                />
                <Button
                    variant="contained"
                    color="secondary"
                    disabled={!canRestricted}
                    onClick={handleOpen}
                    sx={miscellaneousStyle}
                >
                    Delete Project
                </Button>
            </Box>
            <h1>Topology</h1>
            <Box display="flex" alignItems="flex-start">
                <Box display="inline-block" width="70%">
                    <Topology
                        height="800px"
                        nodes={nodes}
                        links={links}
                        selectedNode={handleSelect}
                        unselectNode={handleUnselect}
                    />
                </Box>
                <Entity
                    entities={project.entity}
                    project={project.name}
                    selectedEntity={selectedEntity}
                    selectedNetwork={selectedNetwork}
                    onUnselect={handleUnselect}
                />
            </Box>
            <JobsStatusesInfos />
            <Dialog
                title="Are you sure?"
                open={open}
                cancel={{label: "Cancel", action: handleClose}}
                actions={[{label: "Delete", action: handleDeleteProject}]}
            >
                <DialogContent>
                    <DialogContentText>
                        Deleting the project {project.name} is irreversible. Proceed anyways?
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
};


interface Props {
}


export default ProjectDetails;
