import React from 'react';
import {useFormContext, useFieldArray, Controller} from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import InfoIcon from '@mui/icons-material/Info';

import NumberField from '../common/NumberField';

import type {IJobArgument, TStartJobParameterValue, Form, FunctionForm} from '../../utils/interfaces';
import type {UseControllerProps} from 'react-hook-form';


const StringField: React.FC<PasswordField> = (props) => {
    const {label, password, required: _, ...controllerProps} = props;

    return (
        <Controller
            {...controllerProps}
            render={({field: {onChange, onBlur, value, ref}}) => (
                <TextField
                    margin="dense"
                    variant="standard"
                    type={password ? "password" : undefined}
                    label={label}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    inputRef={ref}
                    sx={{flexGrow: 1}}
                />
            )}
        />
    );
};


const NumericField: React.FC<NumericalField> = (props) => {
    const {label, step, required: _, ...controllerProps} = props;

    return (
        <NumberField
            variant="standard"
            label={label}
            step={step}
            sx={{flexGrow: 1}}
            {...controllerProps}
            rules={{required: false}}
        />
    );
};


const BooleanField: React.FC<Field> = (props) => {
    const {label, onChange: handleChange, required: _, ...controllerProps} = props;

    return (
        <FormGroup sx={{flexGrow: 1}}>
            <FormControlLabel
                control={<Controller
                    {...controllerProps}
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <Checkbox checked={value} onChange={handleChange ? (e) => {onChange(e); handleChange();} : onChange} onBlur={onBlur} inputRef={ref} />
                    )}
                />}
                label={label}
            />
        </FormGroup>
    );
};


const ChoiceField: React.FC<SelectField> = (props) => {
    const {label, choices, required: _, ...controllerProps} = props;

    return (
        <Controller
            {...controllerProps}
            render={({field: {onChange, onBlur, value, ref}}) => (
                <TextField
                    margin="dense"
                    variant="standard"
                    select
                    label={label}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    inputRef={ref}
                    sx={{flexGrow: 1}}
                >
                    {["", ...choices].map((option: string) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                </TextField>
            )}
        />
    );
};


const IdField: React.FC<OpenbachFunctionField> = (props) => {
    const {label, type, others, required: _, ...controllerProps} = props;

    const choices = React.useMemo(() => {
        return others.filter((openbachFunction: FunctionForm) => openbachFunction.kind === type).map(
            ({id, label}: FunctionForm) => ({id, label})
        );
    }, [others, type]);

    return (
        <FormControl size="small" sx={{flexGrow: 1}}>
            <InputLabel>{label}</InputLabel>
            <Controller
                {...controllerProps}
                render={({field: {onChange, onBlur, value, ref}}) => (
                    <Select
                        label={label}
                        variant="standard"
                        onChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        inputRef={ref}
                        fullWidth
                        multiple
                        renderValue={(values: number[]) => (
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {values.map((value: number) => (
                                    <Chip key={value} label={choices.find(({id}) => id === value)?.label} />
                                ))}
                            </Box>
                        )}
                    >
                        {choices.map(({id, label}) => <MenuItem key={id} value={id}>{label}</MenuItem>)}
                    </Select>
                )}
            />
        </FormControl>
    );
};


const StartJobInstanceParameterRow: React.FC<RowProps> = (props) => {
    const {name, label, defaultValue, minLength, maxLength, type, password, choices, others, onChange} = props;
    const {fields, append} = useFieldArray({name, shouldUnregister: false, rules: {minLength, maxLength}});
    const {getValues, setValue} = useFormContext<Form>();

    const addNewField = React.useCallback(() => {
        append(defaultValue);
        if (onChange) {
            onChange();
        }
    }, [append, defaultValue, onChange]);

    React.useEffect(() => {
        const values = getValues(name);
        if (fields.length !== (values as any)?.length) {
            setValue(name, values);
        }
    }, [name, fields, getValues, setValue]);

    return (
        <React.Fragment>
            {fields.map((field, index: number) => {
                // const canAddNew = (maxLength == null || index < maxLength - 1) && index === fields.length - 1;
                const canAddNew = index === fields.length - 1;
                switch(type) {
                    case "None":
                        return (
                            <BooleanField
                                key={field.id}
                                label={label}
                                required={index < minLength}
                                name={`${name}.${index}`}
                                rules={{required: false}}
                                defaultValue={defaultValue as unknown as undefined}
                                onChange={canAddNew ? addNewField : onChange}
                            />
                        );
                    case "int":
                        return (
                            <NumericField
                                key={field.id}
                                label={label}
                                step={1}
                                required={index < minLength}
                                name={`${name}.${index}`}
                                rules={{required: false}}
                                defaultValue={defaultValue as unknown as undefined}
                                onChange={canAddNew ? addNewField : onChange}
                            />
                        );
                    case "float":
                        return (
                            <NumericField
                                key={field.id}
                                label={label}
                                step={0.1}
                                required={index < minLength}
                                name={`${name}.${index}`}
                                rules={{required: false}}
                                defaultValue={defaultValue as unknown as undefined}
                                onChange={canAddNew ? addNewField : onChange}
                            />
                        );
                    case "job":
                        return (
                            <IdField
                                key={field.id}
                                label={label}
                                type="start_job_instance"
                                others={others}
                                required={index < minLength}
                                name={`${name}.${index}`}
                                rules={{required: false}}
                                defaultValue={defaultValue as unknown as undefined}
                                onChange={canAddNew ? addNewField : onChange}
                            />
                        );
                    case "scenario":
                        return (
                            <IdField
                                key={field.id}
                                label={label}
                                type="start_scenario_instance"
                                others={others}
                                required={index < minLength}
                                name={`${name}.${index}`}
                                rules={{required: false}}
                                defaultValue={defaultValue as unknown as undefined}
                                onChange={canAddNew ? addNewField : onChange}
                            />
                        );
                    default:
                        if (choices && choices.length) {
                            return (
                                <ChoiceField
                                    key={field.id}
                                    label={label}
                                    choices={choices}
                                    required={index < minLength}
                                    name={`${name}.${index}`}
                                    rules={{required: false}}
                                    defaultValue={defaultValue as unknown as undefined}
                                    onChange={canAddNew ? addNewField : onChange}
                                />
                            );
                        }
                        return (
                            <StringField
                                key={field.id}
                                label={label}
                                password={password}
                                required={index < minLength}
                                name={`${name}.${index}`}
                                rules={{required: false}}
                                defaultValue={defaultValue as unknown as undefined}
                                onChange={canAddNew ? addNewField : onChange}
                            />
                        );
                }
            })}
        </React.Fragment>
    );
};


const StartJobInstanceParameterField: React.FC<Props> = (props) => {
    const {index, argument, others, name: suffix, jobName} = props;
    const {name, count, description, type, default: defaultValue, password, choices, repeatable} = argument;
    const formName = `functions.${index}.parameters.${jobName}.${suffix}` as const;
    const {fields, append} = useFieldArray({
        name: formName,
        shouldUnregister: false,
        rules: {minLength: 1, maxLength: repeatable ? undefined : 1},
    });
    const {getValues} = useFormContext<Form>();

    const [countLower, countUpper] = React.useMemo(() => {
        if (!count) {
            return [0, 0];
        }

        const c = Math.max(Number(count), 0);
        if (!isNaN(c)) {
            return [c, c];
        } else if (count === "*") {
            return [0, undefined];
        } else if (count === "+") {
            return [1, undefined];
        } else {
            const [lower, upper] = count.split("-");
            if (!upper) {
                return [0, 0];
            }

            return [Math.max(Number(lower), 0), Math.max(Number(upper), 0)].sort();
        }
    }, [count]);

    const sensibleDefault = React.useMemo(() => {
        if (defaultValue) {
            return defaultValue;
        }

        switch (type) {
            case "None":
                return false;
            case "job":
            case "scenario":
                return [];
            default:
                return "";
        }
    }, [type, defaultValue]);

    const addNewRow = React.useCallback(() => {
        append([Array.from({length: Math.max(countLower, 1)}, () => sensibleDefault)]);
    }, [append, countLower, sensibleDefault]);

    React.useEffect(() => {
        const values = getValues(formName) as TStartJobParameterValue[][];
        if (!values?.length) {
            addNewRow();
        }
    }, [getValues, formName, addNewRow]);

    return (
        <React.Fragment>
            {fields.map((field, index: number) => (
                <Box key={field.id} display="flex" flexWrap="wrap" gap={0.5} alignItems="flex-end">
                    <StartJobInstanceParameterRow
                        name={`${formName}.${index}`}
                        label={name}
                        defaultValue={sensibleDefault}
                        minLength={countLower}
                        maxLength={countUpper}
                        type={type}
                        password={password}
                        choices={choices}
                        others={others}
                        onChange={repeatable && index === fields.length - 1 ? addNewRow : undefined}
                    />
                    <Tooltip title={description} placement="right">
                        <IconButton color="primary" component="span">
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            ))}
        </React.Fragment>
    );
};


interface Props {
    index: number;
    argument: IJobArgument;
    others: FunctionForm[];
    name: string;
    jobName: string;
}


interface RowProps {
    name: `functions.${number}.parameters.${string}.${string}.${number}`;
    label: string;
    defaultValue: boolean | string | number[];
    minLength: number;
    maxLength?: number;
    type: string;
    password: boolean;
    choices?: string[];
    others: FunctionForm[];
    onChange?: () => void;
}


interface Field extends UseControllerProps<Form, `functions.${number}.parameters.${string}.${string}.${number}.${number}`> {
    label: string;
    required: boolean;
    onChange?: () => void;
}


interface NumericalField extends Field {
    step: number;
}


interface PasswordField extends Field {
    password: boolean;
}


interface SelectField extends Field {
    choices: string[];
}


interface OpenbachFunctionField extends Field {
    type: "start_job_instance" | "start_scenario_instance";
    others: FunctionForm[];
}


export default StartJobInstanceParameterField;
