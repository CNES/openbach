import React from 'react';

import List from '@mui/material/List';

import AgentStatus from './AgentStatus';

import {useSelector} from '../../redux';
import type {IAgent} from '../../utils/interfaces';


const Status: React.FC<Props> = (props) => {
    const agents = useSelector((state) => state.openbach.agents);

    if (!agents) {
        return (
            <h1>Fetching Agents, please wait!</h1>
        );
    }

    return (
        <React.Fragment>
            <h1>Agents</h1>
            <List>{agents.map((agent: IAgent) => <AgentStatus key={agent.name} agent={agent} />)}</List>
        </React.Fragment>
    );
};


interface Props {
}


export default Status;
