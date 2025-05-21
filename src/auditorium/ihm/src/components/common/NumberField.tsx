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
    const {variant, type, label, sx, fullWidth, step=1, color, onChange, ...controllerProps} = props;
    const {getValues, setValue} = useFormContext<Form>();
    const {name} = controllerProps;

    const handleChange = React.useCallback((onFieldChange: (e: unknown) => void) => (e: unknown) => {
        onFieldChange(e);
        if (onChange) {
            onChange();
        }
    }, [onChange]);

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
            title="Decrement"
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
            title="Increment"
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
                    onChange={handleChange(onChange)}
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
    onChange?: () => void;
};


export default NumberField;
