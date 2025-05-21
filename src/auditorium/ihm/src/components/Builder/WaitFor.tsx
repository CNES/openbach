import React from 'react';
import {useController} from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import type {IOpenbachFunctionWait, Form, FunctionForm} from '../../utils/interfaces';
import type {SelectChangeEvent} from '@mui/material/Select';
import type {UseControllerProps} from 'react-hook-form';


const WaitFor: React.FC<Props & UseControllerProps<Form, `functions.${number}.wait.${keyof Omit<IOpenbachFunctionWait, 'time'>}`>> = (props) => {
    const {awaitables, label, forceRefresh, ...controllerProps} = props;
    const {field: {onChange, onBlur, value, ref}} = useController(controllerProps);

    const handleChange = React.useCallback((event: SelectChangeEvent<number[]>) => {
        const {value} = event.target;
        onChange(typeof value === 'string' ? [] : value);
    }, [onChange]);

    return (
        <FormControl size="small" sx={{display: "flex", mx: 2, gap: 2, flexDirection: "row", alignItems: "center"}}>
            <Select
                value={value}
                onChange={(e) => {handleChange(e); forceRefresh();}}
                onBlur={onBlur}
                inputRef={ref}
                fullWidth
                multiple
                renderValue={(values: number[]) => (
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                        {values.map((value: number) => (
                            <Chip key={value} label={awaitables.find((f: FunctionForm) => f.id === value)?.label} />
                        ))}
                    </Box>
                )}
                sx={{width: "70%"}}
            >
                {awaitables.map(({id, label}: FunctionForm) => (
                    <MenuItem key={id} value={id}>{label}</MenuItem>
                ))}
            </Select>
            <p>{label}</p>
        </FormControl>
    );
};


interface Props {
    awaitables: FunctionForm[];
    label: string;
    forceRefresh: () => void;
}


export default WaitFor;
