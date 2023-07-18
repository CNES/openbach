import React from 'react';

import Box from '@mui/material/Box';

import AgentAdd from './AgentAdd';
import Status from './Status';
import Topology from './AgentsTopology';

import {getCollectors, getAgents} from '../../api/agents';
import {getProjects} from '../../api/projects';
import {useDispatch} from '../../redux';
import {setTitle} from '../../redux/message';


const Agents: React.FC<Props> = (props) => {
    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(setTitle("OpenBach Administration"));
        const promises = [
            dispatch(getCollectors()),
            dispatch(getProjects()),
            dispatch(getAgents({services: true})),
        ];
        return () => {promises.forEach((promise) => {promise.abort();});};
    }, [dispatch]);

    return (
        <React.Fragment>
            <Box display="inline-block" width="70%" sx={{verticalAlign: "top"}}>
                <Status />
                <Topology />
            </Box>
            <Box display="inline-block" boxSizing="border-box" pl={2} width="30%" sx={{verticalAlign: "top"}}>
                <AgentAdd />
            </Box>
        </React.Fragment>
    );
};


interface Props {
}


export default Agents;
