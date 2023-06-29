import React from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import {grey, green, cyan, indigo, red, orange} from '@mui/material/colors';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnknownIcon from '@mui/icons-material/HelpOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import StopIcon from '@mui/icons-material/Stop';
import Unreachable from '@mui/icons-material/CloudOff';

import {TScenarioInstanceStatus} from '../../utils/interfaces';


const ScenarioInstanceStatusIcon: React.FC<Props> = (props) => {
    switch (props.status) {
        case "Running":
            return <CircularProgress sx={{color: green[500]}} size={24} />;
        case "Scheduling":
            return <ScheduleIcon sx={{color: grey[500]}} />;
        case "Finished Ok":
            return <CheckCircleIcon sx={{color: cyan[500]}} />;
        case "Finished Ko":
            return <ErrorIcon sx={{color: red[500]}} />;
        case "Stopped":
            return <StopIcon sx={{color: indigo[500]}} />;
        case "Agents Unreachable":
            return <Unreachable sx={{color: orange[500]}} />;
        default:
            return <UnknownIcon sx={{color: grey[500]}} />;
    }
};


interface Props {
    status?: TScenarioInstanceStatus;
}


export default ScenarioInstanceStatusIcon;
