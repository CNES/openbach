import React from 'react';

import Tooltip from '@mui/material/Tooltip';

import {lightGreen} from '@mui/material/colors';
import Play from '@mui/icons-material/PlayCircleFilled';


const LaunchScenarioIcon: React.FC<Props> = (props) => {
    const {title = "Launch"} = props;

    return (
        <Tooltip title={title} placement="top-start">
            <Play sx={{color: lightGreen[500]}} />
        </Tooltip>
    );
};


interface Props {
    title?: string;
}


export default LaunchScenarioIcon;
