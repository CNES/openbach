import React from 'react';

import Tooltip from '@mui/material/Tooltip';

import {red} from '@mui/material/colors';
import Stop from '@mui/icons-material/Stop';


const StopScenarioIcon: React.FC<Props> = (props) => {
    const {title = "Stop"} = props;

    return (
        <Tooltip title={title} placement="top-start">
            <Stop sx={{color: red[500]}} />
        </Tooltip>
    );
};


interface Props {
    title?: string;
}


export default StopScenarioIcon;
