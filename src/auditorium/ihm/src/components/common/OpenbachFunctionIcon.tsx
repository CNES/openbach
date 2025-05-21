import React from 'react';

import OpenbachFunction from '@mui/icons-material/Code';
import ScenarioArgument from '@mui/icons-material/BubbleChart';
import StartJobInstance from '@mui/icons-material/EventNote';
import StartScenarioInstance from '@mui/icons-material/Subscriptions';

import {TOpenbachFunction} from '../../utils/interfaces';


const OpenbachFunctionIcon: React.FC<Props> = (props) => {
    switch (props.function) {
        case "start_job_instance":
            return <StartJobInstance />;
        case "start_scenario_instance":
            return <StartScenarioInstance />;
        case "openbach_function":
            return <OpenbachFunction />;
        case "argument":
            return <ScenarioArgument />;
        default:
            return null;
    }
};


interface Props {
    function: TOpenbachFunction;
}


export default OpenbachFunctionIcon;
