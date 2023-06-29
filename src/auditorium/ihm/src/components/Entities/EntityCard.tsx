import React from 'react';

import Button from '@mui/material/Button';

import EntityAgent from './EntityAgent';
import EntityCardTemplate from './EntityCardTemplate';
import JobActionSelector from './JobActionSelector';

import {getJobs} from '../../api/agents';
import {removeEntity, updateEntityAgent} from '../../api/entities';
import {useDispatch, useSelector} from '../../redux';
import type {IAgent, IJob, IEntity, INetwork} from '../../utils/interfaces';


const image = process.env.PUBLIC_URL + '/assets/server.svg';


const EntityCard: React.FC<Props> = (props) => {
    const {project, entity: {name, description, agent, networks}, onRemove} = props;
    const jobs = useSelector((state) => state.openbach.jobs);
    const dispatch = useDispatch();
    const [installedJobs, storeInstalledJobs] = React.useState<string[]>([]);

    const handleRemoveEntity = React.useCallback(() => {
        dispatch(removeEntity({project, name}));
        onRemove();
    }, [project, name, dispatch, onRemove]);

    const handleAgentChange = React.useCallback((agent?: IAgent) => {
        dispatch(updateEntityAgent({project, name, description, agent, networks}));
    }, [project, name, description, networks, dispatch]);

    const linkedNetworks = React.useMemo(() => {
        return (networks || []).map((network: INetwork) => (
            <li key={network.interface}>{network.interface}: {network.ip} (network {network.name})</li>
        ));
    }, [networks]);

    React.useEffect(() => {
        if (agent) {
            const {address} = agent;
            const promise = dispatch(getJobs({address}))
            promise.unwrap().then((payload) => {storeInstalledJobs(payload);});
            return () => {promise.abort();};
        }
    }, [agent, dispatch]);

    const action = (
        <Button
            variant="contained"
            color="secondary"
            onClick={handleRemoveEntity}
        >
            Remove Entity
        </Button>
    );

    return (
        <EntityCardTemplate
            title="Entity"
            subtitle="Click on an entity to select it"
            media={image}
            actions={agent ? (
                <React.Fragment>
                    <JobActionSelector
                        agent={agent.address}
                        action="install"
                        options={(jobs || []).filter((job: IJob) => !installedJobs.includes(job.general.name)).map((job: IJob) => job.general.name)}
                    />
                    <JobActionSelector
                        agent={agent.address}
                        action="uninstall"
                        options={installedJobs}
                    />
                    {action}
                </React.Fragment>
            ) : action}
        >
            <ul>
                <li>Description: <b>{description}</b></li>
                <li>OS: <b>Linux</b></li>
                <li>Interfaces: <ul>{linkedNetworks}</ul></li>
                <li>Agent:
                    <EntityAgent
                        jobs={installedJobs}
                        agent={agent}
                        project={project}
                        onAgentChange={handleAgentChange}
                    />
                </li>
            </ul>
        </EntityCardTemplate>
    );
};


interface Props {
    project: string;
    entity: IEntity;
    onRemove: () => void;
}


export default EntityCard;
