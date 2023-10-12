import React from 'react';
import {useController} from 'react-hook-form';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import type {FunctionForm} from '../../utils/interfaces';


const StopScenarioInstance: React.FC<Props> = (props) => {
    const {id, index, others, refresh} = props;
    const {field: {onChange, onBlur, value, ref}} = useController({
        name: `functions.${index}.scenarioId`,
        rules: {required: false},
        defaultValue: "",
    });

    return (
        <React.Fragment>
            <h3>Stopping Scenario</h3>
            <FormControl sx={{width: "100%"}}>
                <InputLabel id={`${id}-scenario-id-label`}>
                    Scenario
                </InputLabel>
                <Select
                    id={`${id}-scenario-id-select`}
                    labelId={`${id}-scenario-id-label`}
                    label="Scenario"
                    variant="standard"
                    onChange={(e) => {onChange(e); refresh();}}
                    onBlur={onBlur}
                    value={value}
                    inputRef={ref}
                    fullWidth
                >
                    {others.filter(
                        (f: FunctionForm) => f.kind === "start_scenario_instance"
                    ).map(({id, label}: FunctionForm) => (
                        <MenuItem key={id} value={id}>{label}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </React.Fragment>
    );
};


interface Props {
    id: string;
    index: number;
    others: FunctionForm[];
    refresh: () => void;
}


export default StopScenarioInstance;