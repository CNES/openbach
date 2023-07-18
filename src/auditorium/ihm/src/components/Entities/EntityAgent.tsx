import React from 'react';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import {useSelector} from '../../redux';
import type {IAgent} from '../../utils/interfaces';
import type {SelectChangeEvent} from '@mui/material/Select';


const EntityAgent: React.FC<Props> = (props) => {
    const {project, jobs, agent, onAgentChange} = props;
    const agents = useSelector((state) => state.openbach.agents);

    const handleAgentChange = React.useCallback((event: SelectChangeEvent) => {
        const address = event.target.value;
        onAgentChange(address ? agents?.find((a: IAgent) => a.address === address) : undefined);
    }, [agents, onAgentChange]);

    const reserved = React.useMemo(() => (agents || []).filter(
        (a: IAgent) => a.reserved === project && (!a.project || a.address === agent?.address)
    ).map((agent: IAgent) => (
        <MenuItem key={agent.address} value={agent.address}>{agent.name}</MenuItem>
    )), [agents, project, agent]);

    const available = React.useMemo(() => (agents || []).filter(
        (a: IAgent) => !a.reserved && (!a.project || a.address === agent?.address)
    ).map((agent: IAgent) => (
        <MenuItem key={agent.address} value={agent.address}>{agent.name}</MenuItem>
    )), [agents, agent]);

    const selector = (
        <FormControl fullWidth>
            <InputLabel id="entity-change-label">Associated Agent</InputLabel>
            <Select
                labelId="entity-change-label"
                id="entity-change-select"
                label="Associated Agent"
                value={agent?.address || ""}
                onChange={handleAgentChange}
            >
                <MenuItem value="" />
                <MenuItem>--- Agents reserved for this project ---</MenuItem>
                {reserved}
                <MenuItem>--- Free Agents ---</MenuItem>
                {available}
            </Select>
        </FormControl>
    );

    if (!agent) {
        return selector;
    }

    const globalAgent = agents?.find((a: IAgent) => a.address === agent.address);

    const services = globalAgent?.services;
    const ntp = !services?.hasOwnProperty('ntp.service') ? "" : services['ntp.service'].split(/\r?\n/).find(
        (s: string) => s.startsWith('*')
    );
    const status = ntp === "" ? "NTP status not fetched" : !ntp ? "NTP not synchronized" : (
        "NTP offset: " + ntp.split(/\s+/)[8] + " ms"
    );
    
    const errors = globalAgent?.errors;

    return (
        <ul>
            <li>{selector}</li>
            <li>IP used for installation: <b>{agent.address}</b></li>
            <li>Collector: <b>{agent.collector_ip}</b></li>
            <li>Installed jobs: {jobs.length ? (
                <ul>
                    {jobs.map((j: string) => <li key={j}>{j}</li>)}
                </ul>
            ) : "No jobs installed"}</li>
            <li>{status}</li>
            {errors && errors.length > 0 && <li>
                <ul>
                    {errors.map((e, index: number) => <li key={index}>{e.msg}</li>)}
                </ul>
            </li>}
        </ul>
    );
};


interface Props {
    jobs: string[];
    project: string;
    agent?: IAgent;
    onAgentChange: (agent?: IAgent) => void;
}


export default EntityAgent;
