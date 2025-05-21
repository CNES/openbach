import React from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import {grey, green, cyan, indigo, red, orange} from '@mui/material/colors';

import RetriedIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnknownIcon from '@mui/icons-material/HelpOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/ErrorOutline';

import {TOpenbachFunctionInstanceStatus} from '../../utils/interfaces';


const OpenbachFunctionStatusIcon: React.FC<Props> = (props) => {
    switch (props.status) {
        case "Scheduled":
            return <ScheduleIcon sx={{color: grey[500]}} />;
        case "Running":
            return <CircularProgress sx={{color: green[500]}} size={24}/>;
        case "Finished":
            return <CheckCircleIcon sx={{color: cyan[500]}} />;
        case "Stopped":
            return <ErrorIcon sx={{color: indigo[500]}} />;
        case "Error":
            return <ErrorIcon sx={{color: red[500]}} />;
        case "Retried":
            return <RetriedIcon sx={{color: orange[500]}} />;
        default:
            return <UnknownIcon sx={{color: grey[500]}} />;
    }
};


interface Props {
    status?: TOpenbachFunctionInstanceStatus;
}


export default OpenbachFunctionStatusIcon;
