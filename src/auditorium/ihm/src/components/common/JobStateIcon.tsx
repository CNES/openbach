import React from 'react';

import {grey, green, red} from '@mui/material/colors';

import RunningIcon from '@mui/icons-material/Autorenew';
import BadStatusIcon from '@mui/icons-material/HighlightOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnknownIcon from '@mui/icons-material/HelpOutline';

import {IJobStateStatus} from '../../utils/interfaces';


const JobStateIcon: React.FC<Props> = (props) => {
    if (!props.status) {
        return <UnknownIcon sx={{color: grey[500]}} />;
    }

    const {returncode} = props.status;
    if (!returncode) {
        return <UnknownIcon sx={{color: red[500]}} />;
    }

    if (returncode === 202) {
        return <RunningIcon sx={{color: "#2A72A9"}} />;
    } else if (returncode < 400) {
        return <CheckCircleIcon sx={{color: green[500]}} />;
    } else {
        return <BadStatusIcon sx={{color: red[500]}} />;
    }
};


interface Props {
    status?: IJobStateStatus;
}


export default JobStateIcon;
