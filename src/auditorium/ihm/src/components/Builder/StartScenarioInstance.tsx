import React from 'react';
import {useController, Controller} from 'react-hook-form';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';

import type {IScenario} from '../../utils/interfaces';


const StartScenarioInstance: React.FC<Props> = (props) => {
    const {id, index, scenarios, refresh} = props;
    const {field: {onChange, onBlur, value: scenarioName, ref}} = useController({
        name: `functions.${index}.scenario`,
        rules: {required: false},
        defaultValue: "",
    });

    const scenario = scenarios.find((s: IScenario) => s.name === scenarioName);

    return (
        <React.Fragment>
            <h3>Starting Scenario</h3>
            <FormControl sx={{width: "100%"}}>
                <InputLabel id={`${id}-scenario-label`}>
                    Scenario
                </InputLabel>
                <Select
                    id={`${id}-scenario-select`}
                    labelId={`${id}-scenario-label`}
                    label="Scenario"
                    variant="standard"
                    onChange={(e) => {onChange(e); refresh();}}
                    onBlur={onBlur}
                    value={scenarioName}
                    inputRef={ref}
                    fullWidth
                >
                    {scenarios.map(({name}: IScenario) => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            {scenario && Object.entries(scenario.arguments || {}).map(([argument, description]) => (
                <Controller
                    name={`functions.${index}.scenarioArguments.${scenarioName}.${argument}`}
                    rules={{required: false}}
                    defaultValue=""
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <TextField
                            key={`${id}.scenarioArguments.${scenarioName}.${argument}`}
                            margin="dense"
                            variant="standard"
                            label={argument}
                            helperText={description}
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        />
                    )}
                />
            ))}
        </React.Fragment>
    );
};


interface Props {
    id: string;
    index: number;
    scenarios: IScenario[];
    refresh: () => void;
}


export default StartScenarioInstance;
