import React from 'react';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import JobStateIcon from '../common/JobStateIcon';

import {stateJob} from '../../api/jobs';
import {getAgents} from '../../api/agents';
import {useDispatch} from '../../redux';
import type {IJobState, IJobStateStatus} from '../../utils/interfaces';


const JobsStatusesQuery: React.FC<Props> = (props) => {
    const {job: jobName, agent, action, status, onClick} = props;
    const dispatch = useDispatch();

    const title = React.useMemo(() => `${action}ing ${jobName} on ${agent}`, [action, jobName, agent]);

    const handleRefresh = React.useCallback(() => {
        dispatch(stateJob({jobName, agent}));
    }, [jobName, agent, dispatch]);

    const handleClick = React.useCallback(() => {
        const content = !status
            ? "Operation not started yet!"
            : !status.response
            ? "Operation successful!"
            : status.response.state
            ? "Operation " + status.response.state
            : status.response.response
            ? JSON.stringify(status.response.response)
            : "Format of the response is unknown. Return code was " + status.response.returncode;
        onClick(title, content);
    }, [title, status, onClick]);

    React.useEffect(() => {
        if (!status || status.returncode === 202) {
            const timeout = setTimeout(handleRefresh, 1000);
            return () => {clearTimeout(timeout);};
        } else if (status && status.returncode !== 202) {
            const promise = dispatch(getAgents({services: false}));
            return () => {promise.abort();};
        }
    }, [status, handleRefresh, dispatch]);

    return (
        <ListItemButton onClick={handleClick}>
            <ListItemIcon>
                <JobStateIcon status={status} />
            </ListItemIcon>
            <ListItemText primary={title} />
        </ListItemButton>
    );
};


interface Props {
    job: string;
    agent: string;
    action: keyof IJobState;
    status?: IJobStateStatus;
    onClick: (title: string, content: string) => void;
}


export default JobsStatusesQuery;
