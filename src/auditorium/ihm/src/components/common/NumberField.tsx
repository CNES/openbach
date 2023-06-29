import React from 'react';
import {useFormContext, Controller} from 'react-hook-form';

import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import type {Form} from '../../utils/interfaces';
import type {Theme} from '@mui/material/styles';
import type {SxProps} from '@mui/system';
import type {UseControllerProps} from 'react-hook-form';


const NumberField: React.FC<Props & UseControllerProps<Form>> = (props) => {
    const {variant, type, label, sx, fullWidth, step=1, color, ...controllerProps} = props;
    const {getValues, setValue} = useFormContext<Form>();
    const {name} = controllerProps;

    const handleIncrement = React.useCallback(() => {
        const value = Number(getValues(name));
        setValue(name, isNaN(value) ? 0 : value + step);
    }, [name, getValues, setValue, step]);

    const handleDecrement = React.useCallback(() => {
        const value = Number(getValues(name));
        setValue(name, isNaN(value) ? 0 : value - step);
    }, [name, getValues, setValue, step]);

    const minus = (
        <Tooltip
            title={/*typeof value === 'number' ? "Decrement" : "Reinitialize to 0"*/"Decrement"}
            placement="top"
        >
            <IconButton
                color={color}
                onClick={handleDecrement}
            >
                -
            </IconButton>
        </Tooltip>
    );

    const plus = (
        <Tooltip
            title={/*typeof value === 'number' ? "Increment" : "Reinitialize to 0"*/"Increment"}
            placement="top"
        >
            <IconButton
                color={color}
                onClick={handleIncrement}
            >
                +
            </IconButton>
        </Tooltip>
    );

    return (
        <Controller
            {...controllerProps}
            render={({field: {onChange, onBlur, value, ref}}) => (
                <TextField
                    margin="dense"
                    variant={variant}
                    color={color}
                    fullWidth={fullWidth}
                    type={type}
                    label={label}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    inputRef={ref}
                    sx={sx}
                    InputProps={{
                        startAdornment: minus,
                        endAdornment: plus,
                    }}
                />
            )}
        />
    );
};


interface Props {
    variant: "standard" | "filled" | "outlined";
    type?: "password";
    label: string;
    sx?: SxProps<Theme>;
    fullWidth?: boolean;
    step?: number;
    color?: "primary" | "secondary";
};


/*
declare type ExpectedKeys = `functions.${number}.on_fail.retry`
                          | `functions.${number}.on_fail.delay`
                          | `functions.${number}.wait.time`
                          | `functions.${number}.offset`
                          | `functions.${number}.interval`
                          | `functions.${number}.parameters.${string}.${string}.${number}.${number}`;
*/


export default NumberField;
