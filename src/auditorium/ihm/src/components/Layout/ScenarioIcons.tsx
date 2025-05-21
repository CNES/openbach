import React from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import OpenbachFunctionIcon from '../common/OpenbachFunctionIcon';
import OpenbachFunctionStatusIcon from '../common/OpenbachFunctionStatusIcon';
import JobInstanceStatusIcon from '../common/JobInstanceStatusIcon';
import ScenarioInstanceStatusIcon from '../common/ScenarioInstanceStatusIcon';

import {useDispatch} from '../../redux';
import {setTitle} from '../../redux/message';


const ScenarioIcons: React.FC<Props> = (props) => {
    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(setTitle("List of Scenario Icons"));
    }, [dispatch]);

    return (
        <React.Fragment>
            <h1>Icons for Openbach Functions</h1>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Icon</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell><OpenbachFunctionIcon function="start_job_instance" /></TableCell>
                            <TableCell>Job Instance Icon</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionIcon function="start_scenario_instance" /></TableCell>
                            <TableCell>Scenario Instance Icon</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionIcon function="openbach_function" /></TableCell>
                            <TableCell>Openbach Function Icon</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionIcon function="argument" /></TableCell>
                            <TableCell>Scenario Argument Icon</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <h1>Icons for Openbach Functions Statuses</h1>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Icon</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell><OpenbachFunctionStatusIcon status="Scheduled" /></TableCell>
                            <TableCell>Scheduled</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionStatusIcon status="Running" /></TableCell>
                            <TableCell>Running</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionStatusIcon status="Finished" /></TableCell>
                            <TableCell>Finished</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionStatusIcon status="Stopped" /></TableCell>
                            <TableCell>Stopped</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionStatusIcon status="Error" /></TableCell>
                            <TableCell>Error</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionStatusIcon status="Retried" /></TableCell>
                            <TableCell>Function experienced error but has been retried</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><OpenbachFunctionStatusIcon /></TableCell>
                            <TableCell>Unknown</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <h1>Icons for Job Instances Statuses</h1>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Icon</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell><JobInstanceStatusIcon status="Not Scheduled" /></TableCell>
                            <TableCell>Not Scheduled</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><JobInstanceStatusIcon status="Scheduled" /></TableCell>
                            <TableCell>Scheduled</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><JobInstanceStatusIcon status="Running" /></TableCell>
                            <TableCell>Running</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><JobInstanceStatusIcon status="Not Running" /></TableCell>
                            <TableCell>Not Running</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><JobInstanceStatusIcon status="Error" /></TableCell>
                            <TableCell>Error</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><JobInstanceStatusIcon status="Stopped" /></TableCell>
                            <TableCell>Stopped</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><JobInstanceStatusIcon status="Agent Unreachable" /></TableCell>
                            <TableCell>Agent Unreachable</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><JobInstanceStatusIcon /></TableCell>
                            <TableCell>Unknown</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <h1>Icons for Scenario Instances Statuses</h1>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Icon</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell><ScenarioInstanceStatusIcon status="Running" /></TableCell>
                            <TableCell>Running</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><ScenarioInstanceStatusIcon status="Scheduling" /></TableCell>
                            <TableCell>Scheduling</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><ScenarioInstanceStatusIcon status="Finished Ok" /></TableCell>
                            <TableCell>Finished OK</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><ScenarioInstanceStatusIcon status="Finished Ko" /></TableCell>
                            <TableCell>Finished KO</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><ScenarioInstanceStatusIcon status="Stopped" /></TableCell>
                            <TableCell>Stopped</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><ScenarioInstanceStatusIcon status="Agents Unreachable" /></TableCell>
                            <TableCell>An Agent became Unreachabled</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><ScenarioInstanceStatusIcon /></TableCell>
                            <TableCell>Unknown</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </React.Fragment>
    );
};


interface Props {
}


export default ScenarioIcons;
