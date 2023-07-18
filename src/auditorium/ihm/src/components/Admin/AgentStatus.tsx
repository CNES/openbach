import React from 'react';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import NoDaemon from '@mui/icons-material/Cloud';
import NoConnection from '@mui/icons-material/CloudOff';
import Ok from '@mui/icons-material/CloudDone';
import {grey, red, orange, green} from '@mui/material/colors';
import {styled} from '@mui/material/styles';

import AgentUninstall from './AgentUninstall';

import {reserveProject} from '../../api/agents';
import {useDispatch, useSelector} from '../../redux';
import type {IAgent} from '../../utils/interfaces';
import type {SelectChangeEvent} from '@mui/material/Select';


const Section = styled('section')({
    padding: "3px 3%",
});


const SectionTitle = styled('h1')({
    margin: "0 -1%",
});


const GetNotIfFalse = (status?: boolean) => {
    if (!status) {
        return <Box component="span" color={red[500]}>not</Box>;
    }
};


const AgentStatus: React.FC<Props> = (props) => {
    const {agent} = props;
    const dispatch = useDispatch();
    const projects = useSelector((state) => state.openbach.projects);
    const isAdmin = useSelector((state) => state.login.is_admin);
    const [open, storeOpen] = React.useState<boolean>(false);

    const handleCollapseToggle = React.useCallback(() => {
        storeOpen((o: boolean) => !o);
    }, []);

    const handleReserveProject = React.useCallback((event: SelectChangeEvent) => {
        dispatch(reserveProject({address: agent.address, projectName: event.target.value}));
    }, [agent.address, dispatch]);

    const projectInfo = agent.project ? (
        <p>Associated to project {agent.project}</p>
    ) : isAdmin ? (
        <div>
            <FormControl fullWidth>
                <InputLabel id={`project-label-for-${agent.name}`}>Reserve for Project</InputLabel>
                <Select
                    labelId={`project-label-for-${agent.name}`}
                    id={`project-select-for-${agent.name}`}
                    value={agent.reserved || ""}
                    label="Reserve for Project"
                    onChange={handleReserveProject}
                >
                    <MenuItem value="">--- Select a Project ---</MenuItem>
                    {projects?.map((project) => <MenuItem key={project.name} value={project.name}>{project.name}</MenuItem>)}
                </Select>
            </FormControl>
        </div>
    ) : agent.reserved ? (
        <p>Reserved for project {agent.reserved}</p>
    ) : (
        <p>Not associated to any project</p>
    );

    const agentIcon = agent.reachable ? (
        agent.available ? <Ok sx={{color: green[500]}} /> : <NoDaemon sx={{color: orange[500]}} />
    ) : <NoConnection sx={{color: red[500]}} />;

    const services = agent.services || {};
    const servicesSection = Object.entries(services).filter(([service, status]) => (
        service !== "ntp.service" && status !== undefined && status !== null
    )).map(([service, status]) => {
        const color = !status ? grey[500] : status === "running" ? green[500] : red[500];
        return <p key={service}>{service} is <Box component="span" color={color}>{status}</Box></p>;
    });

    const ntp = services["ntp.service"];

    return (
        <React.Fragment>
            <ListItemButton onClick={handleCollapseToggle}>
                <ListItemIcon>{agentIcon}</ListItemIcon>
                <ListItemText primary={agent.name} secondary={agent.address} />
                {open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box px={2}>
                    <h1>{agent.name}</h1>
                    <Section>
                        <SectionTitle>General</SectionTitle>
                        <p>Address: {agent.address}</p>
                        <p>Collector: {agent.collector_ip}</p>
                        <p>Agent is {GetNotIfFalse(agent.reachable)} reachable and {GetNotIfFalse(agent.available)} available</p>
                        {projectInfo}
                        {isAdmin && <AgentUninstall
                            name={agent.name}
                            address={agent.address}
                            collector={agent.collector_ip}
                            reachable={agent.reachable}
                            available={agent.available}
                        />}
                    </Section>
                    {Boolean(agent.errors && agent.errors.length) && <Section>
                        <SectionTitle>Error{agent.errors!.length > 1 ? "s" : ""}</SectionTitle>
                        {agent.errors!.map(({msg}: {msg: string;}, index: number) => <p key={index}>{msg}</p>)}
                    </Section>}
                    {Boolean(ntp) && <Section>
                        <SectionTitle>NTP</SectionTitle>
                        <code><pre>{ntp}</pre></code>
                    </Section>}
                    {Boolean(servicesSection.length) && <Section>
                        <SectionTitle>Service{servicesSection.length > 1 ? "s" : ""}</SectionTitle>
                        {servicesSection}
                    </Section>}
                </Box>
            </Collapse>
        </React.Fragment>
    );
};


interface Props {
    agent: IAgent;
}


export default AgentStatus;
