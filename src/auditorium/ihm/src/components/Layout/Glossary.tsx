import React from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';

import {useDispatch} from '../../redux';
import {setTitle} from '../../redux/message';


const glossary = [{
    description: "A recipient which collects the data sent by an agent",
    name: "collector",
}, {
    description: "An agent installed on a physical entity",
    name: "agent",
}, {
    description: "An entity, linked or not to an agent",
    name: "entity",
}, {
    description: "A project, where entities are linked to agent in order to create/use scenarios",
    name: "project",
}, {
    description: "An action in a scenario, ie: the job implementation",
    name: "scenarioAction",
}, {
    description: "A number of individual tasks (one or more) with a common purpose and to be executed in a sole Agent. \n" +
    "A job might be able to launch/configure other software tools (e.g. ping/iperf) and OS tools (e.g. iptables), configure OS parameters, " +
    "collect information/stats from tools/OS, etc.\n\n(TERM_01)\n\n" +
    "A classification of ScenarioAction types depending on their purpose is defined in this document.",
    name: "job",
}, {
    description: "An execution of a job configured with a set of parameters",
    name: "job instance",
}, {
    description: "Function defined and executed by the Controller for performing tasks related to: \n" +
    "install agents/Jobs, configure and schedule ScenarioAction/scenario instances, " +
    "perform information/status requests regarding Agents/Jobs/Scenarios and their instances, etc.",
    name: "openbach-function",
}, {
    description: "Set of openbach-functions that allow to perform different tasks might be executed in different Agents to accomplish an action",
    name: "scenario",
}, {
    description: "An execution of a scenario with a set of parameters.\n" +
    "A scenario must include a “reference starting time”. " +
    "The scheduling times of each of the functions to be executed with in it shall be defined as an increment (∆) " +
    "of the “reference starting time” of the scenario.",
    name: "scenario instance",
}].sort((element1, element2) => element1.name.localeCompare(element2.name));


const Glossary: React.FC<Props> = (props) => {
    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(setTitle("OpenBach Glossary"));
    }, [dispatch]);

    return (
        <React.Fragment>
            <h1>Glossary</h1>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <Tooltip title="The name" placement="top-start">
                                <TableCell>Term</TableCell>
                            </Tooltip>
                            <Tooltip title="The description" placement="top-start">
                                <TableCell>Definition</TableCell>
                            </Tooltip>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {glossary.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{entry.name}</TableCell>
                                <TableCell sx={{whiteSpace: "pre"}}>{entry.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </React.Fragment>
    );
};


interface Props {
}


export default Glossary;
