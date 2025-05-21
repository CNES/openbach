import React from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import {grey, green, indigo, red, orange} from '@mui/material/colors';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnknownIcon from '@mui/icons-material/HelpOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import StopIcon from '@mui/icons-material/Stop';
import Unreachable from '@mui/icons-material/CloudOff';

import {TJobInstanceStatus} from '../../utils/interfaces';


const JobInstanceStatusIcon: React.FC<Props> = (props) => {
    switch (props.status) {
        case "Not Scheduled":
            return <CheckCircleIcon sx={{color: grey[500]}} />;
        case "Scheduled":
            return <ScheduleIcon sx={{color: grey[500]}} />;
        case "Running":
            return <CircularProgress sx={{color: green[500]}} size={24} />;
        case "Not Running":
            return <CheckCircleIcon sx={{color: grey[500]}} />;
        case "Error":
            return <ErrorIcon sx={{color: red[500]}} />;
        case "Stopped":
            return <StopIcon sx={{color: indigo[500]}} />;
        case "Agent Unreachable":
            return <Unreachable sx={{color: orange[500]}} />;
        default:
            return <UnknownIcon sx={{color: grey[500]}} />;
    }
};


interface Props {
    status?: TJobInstanceStatus;
}


export default JobInstanceStatusIcon;
