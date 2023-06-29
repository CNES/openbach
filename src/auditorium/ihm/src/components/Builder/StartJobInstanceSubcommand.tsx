import React from 'react';
import {useFormContext, Controller} from 'react-hook-form';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import StartJobInstanceParameterField from './StartJobInstanceParameterField';

import type {
    IJob, IJobArgument,
    IJobSubcommand,
    IJobSubcommandGroup,
    Form, FunctionForm,
} from '../../utils/interfaces';


const StartJobInstanceSubcommand: React.FC<Props> = (props) => {
    const {id, index, job, groups, others, arguments: args} = props;
    const {watch} = useFormContext<Form>();

/*
    const handleChange = React.useCallback((parameter: string) => (values: TStartJobParameterValue[][]) => {
        const parameters = groups.map(({selected}) => selected);
        parameters.push(parameter);
        dispatch(changeOpenbachFunctionParameter({name, index, job, parameters, values}));
    }, [name, index, job, groups, dispatch]);

    const handleSubcommandChange = React.useCallback((group: string) => (event: SelectChangeEvent<string>) => {
        const {value} = event.target;
        const selected = value ? value : undefined;
        const commands = groups.map(({name}) => name);
        commands.push(group);
        dispatch(changeOpenbachFunctionSubcommand({name, index, job, groups: commands, selected}));
    }, [name, index, job, groups, dispatch]);
*/

    const transform = React.useCallback((argument: IJobArgument) => {
        const path = groups.map(({selected}) => selected);
        path.push(argument.name);

        return (
            <StartJobInstanceParameterField
                key={`${id}.${argument.name}`}
                index={index}
                argument={argument}
                others={others}
                jobName={job}
                name={path.join(".")}
            />
        );
    }, [id, index, job, others, groups]);

    const renderSubcommand = React.useCallback((group: IJobSubcommandGroup) => {
        const {group_name: groupName, choices, optional} = group;
        const options = choices.map(({name}: IJobSubcommand) => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
        ));

        if (optional) {
            options.unshift(<MenuItem key="" value="" sx={{color: "silver"}}><em>Clear Choice</em></MenuItem>);
        }

        const groupNames = groups.map(({name}) => name).join("-");
        const groupPath = groups.map(({name, selected}) => `${name}.${selected}`).join(".");
        const selectorName = `functions.${index}.subcommands.${job}.${groupPath}.${groupName}.selected` as const;
        const selector = (
            <FormControl key={`${id}.${groupName}`} sx={{minWidth: "198px"}}>
                <InputLabel id={`${id}-sub-${groupNames}-${groupName}-label`}>
                    {groupName}
                </InputLabel>
                <Controller
                    name={selectorName}
                    rules={{required: false}}
                    defaultValue={"" as unknown as undefined}
                    render={({field: {onChange, onBlur, value, ref}}) => (
                        <Select
                            id={`${id}-sub-${groupNames}-${groupName}-select`}
                            labelId={`${id}-sub-${groupNames}-${groupName}-label`}
                            label={groupName}
                            variant="standard"
                            onChange={onChange}
                            onBlur={onBlur}
                            value={value}
                            inputRef={ref}
                            fullWidth
                        >
                            {options}
                        </Select>
                    )}
                />
            </FormControl>
        );

        const selected = watch(selectorName);
        if (!selected) {
            return selector;
        }

        return (
            <React.Fragment key={groupName}>
                {selector}
                <StartJobInstanceSubcommand
                    id={id}
                    index={index}
                    job={job}
                    arguments={choices.find(({name}: IJobSubcommand) => name === selected)}
                    groups={[...groups, {name: groupName, selected}]}
                    others={others}
                />
            </React.Fragment>
        );
    }, [id, index, job, others, groups, watch]);

    const {required=[], optional=[]} = (args || {});
    const requiredFields = required.map(transform);
    const optionalFields = optional.map(transform);

    args?.subcommands?.forEach((group: IJobSubcommandGroup) => {
        if (group.optional) {
            optionalFields.push(renderSubcommand(group));
        } else {
            requiredFields.push(renderSubcommand(group));
        }
    });

    const result = (
        <React.Fragment>
            {requiredFields.length > 0 && <h3>Required</h3>}
            {requiredFields}
            {optionalFields.length > 0 && <h3>Optional</h3>}
            {optionalFields}
        </React.Fragment>
    );

    if (groups.length > 0) {
        return <Box ml={2}>{result}</Box>;
    }

    return result;
};


interface Props {
    id: string;
    index: number;
    job: string;
    arguments?: IJob['arguments'];
    groups: {name: string; selected: string;}[];
    others: FunctionForm[];
}


export default StartJobInstanceSubcommand;
