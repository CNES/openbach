import React from 'react';
import {useParams} from 'react-router';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ErrorIcon from '@mui/icons-material/NewReleasesTwoTone';

import ScenarioInstancesList from '../Scenarios/ScenarioInstancesList';
import ScenarioBuilder from '../Builder/ScenarioBuilder';

import {useDispatch, useSelector} from '../../redux';
import {initializeForm} from '../../redux/form';
import type {IScenario} from '../../utils/interfaces';


const SelectedScenario: React.FC<Props> = (props) => {
    const {projectId, scenarioId} = useParams();
    const project = useSelector((state) => state.project.current);
    const jobs = useSelector((state) => state.openbach.jobs);
    const dispatch = useDispatch();

    const scenario = React.useMemo(() => {
        if (project) {
            return project.scenario.find((scenario: IScenario) => scenario.name === scenarioId);
        }
    }, [project, scenarioId]);

    React.useEffect(() => {
        if (scenario && jobs) {
            dispatch(initializeForm({scenario, jobs}));
        }
    }, [scenario, jobs, dispatch]);

    if (!projectId || !scenarioId) {
        return null;
    }

    if (!project) {
        return (
            <Box display="flex" alignItems="center" flexDirection="column">
                <CircularProgress />
                <p>Loading project {projectId}</p>
            </Box>
        );
    }

    if (!scenario) {
        return (
            <Box display="flex" alignItems="center" flexDirection="column">
                <ErrorIcon color="error" fontSize="large" />
                <p>Project {projectId} does not contain a scenario named {scenarioId}</p>
            </Box>
        );
    }

    if (!jobs) {
        return (
            <Box display="flex" alignItems="center" flexDirection="column">
                <CircularProgress />
                <p>Loading jobs list</p>
            </Box>
        );
    }

    return (
        <React.Fragment>
            <Box display="inline-block" width="70%" sx={{verticalAlign: "top"}}>
                <h1>Scenario {scenarioId}</h1>
                <ScenarioBuilder project={projectId} scenario={scenarioId} />
            </Box>
            <Box display="inline-block" width="30%" sx={{verticalAlign: "top"}}>
                <h1>Instances</h1>
                <ScenarioInstancesList project={projectId} scenario={scenarioId} />
            </Box>
        </React.Fragment>
    );
};


interface Props {
}


export default SelectedScenario;
