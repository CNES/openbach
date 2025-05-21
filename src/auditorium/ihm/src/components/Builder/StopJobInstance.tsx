import React from 'react';
import {useController} from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import type {FunctionForm} from '../../utils/interfaces';
import type {SelectChangeEvent} from '@mui/material/Select';


const StopJobInstance: React.FC<Props> = (props) => {
    const {id, index, others, refresh} = props;
    const {field: {onChange, onBlur, value, ref}} = useController({
        name: `functions.${index}.jobs`,
        rules: {required: false},
        defaultValue: [],
    });

    const handleChange = React.useCallback((event: SelectChangeEvent<number[]>) => {
        const {value} = event.target;
        onChange(typeof value === 'string' ? [] : value);
        refresh();
    }, [onChange, refresh]);

    return (
        <React.Fragment>
            <h3>Stopping Jobs</h3>
            <FormControl size="small" sx={{width: "100%"}}>
                <InputLabel id={`${id}-scenario-id-label`}>
                    Jobs
                </InputLabel>
                <Select
                    id={`${id}-scenario-id-select`}
                    labelId={`${id}-scenario-id-label`}
                    label="Jobs"
                    variant="standard"
                    value={value}
                    onChange={handleChange}
                    onBlur={onBlur}
                    inputRef={ref}
                    fullWidth
                    multiple
                    renderValue={(values: number[]) => (
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                            {values.map((value: number) => (
                                <Chip key={value} label={others.find((f: FunctionForm) => f.id === value)?.label} />
                            ))}
                        </Box>
                    )}
                >
                    {others.filter(
                        (f: FunctionForm) => f.kind === "start_job_instance"
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


export default StopJobInstance;
