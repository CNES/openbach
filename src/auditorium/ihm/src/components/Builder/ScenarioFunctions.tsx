import React from 'react';
import {useFormContext, useFieldArray, Controller} from 'react-hook-form';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';

import Add from '@mui/icons-material/Add';

import DeleteIcon from '../common/DeleteIcon';
import ListItem from '../common/NestedListItem';
import NumberField from '../common/NumberField';
import StartJobInstance from './StartJobInstance';
import StopJobInstance from './StopJobInstance';
import StartScenarioInstance from './StartScenarioInstance';
import StopScenarioInstance from './StopScenarioInstance';
import WaitFor from './WaitFor';

import {useSelector} from '../../redux';
import {OpenbachFunctionsList} from '../../utils/interfaces';
import {idToLabel} from '../../utils/openbach-functions';
import type {IScenario, Form, FunctionForm, OpenbachFunctionType} from '../../utils/interfaces';


const mainLabel = (form: FunctionForm, others: FunctionForm[]): string => {
    const {
        label, kind, jobs,
        scenario, scenarioId,
        job, entity,
    } = form;
    const labeled = label ? `[${label}] ` : "";
    switch (kind) {
        case undefined:
        case "" as unknown as undefined:
            return labeled + "Not selected yet";
        case "start_job_instance":
            const jobName = !job ? "no job configured" : job;
            const entityName = !entity ? "unknown entity" : entity;
            return labeled + "Start Job Instance: " + jobName + " on " + entityName;
        case "stop_job_instances":
            if (!jobs || !jobs.length) {
                return labeled + "Stop Job Instance";
            }
            const ending = jobs.length > 1 ? "s: " : ": ";
            const stopped = jobs.map((id: number) => idToLabel(id, others)).join(", ");
            return labeled + "Stop Job Instance" + ending + stopped;
        case "start_scenario_instance":
            const name = !scenario ? "no scenario configured" : scenario;
            return labeled + "Start Scenario Instance: " + name;
        case "stop_scenario_instance":
            const id = !scenarioId && scenarioId !== 0 ? "no scenario configured" : idToLabel(scenarioId, others);
            return labeled + "Stop Scenario Instance: " + id;
        default:
            return labeled + "Uneditable OpenBach Function: " + kind;
    }
};


const dependenciesLabel = ({wait}: FunctionForm, others: FunctionForm[]): string => {
    if (!wait) {
        return "Started immediately";
    }

    const dependencyString = (label: string, ids: number[]): string => {
        if (!ids || !ids.length) {
            return "";
        }

        const waited = ids.map((id: number) => idToLabel(id, others));
        const length = waited.length;
        if (length > 1) {
            waited[length - 1] = "and " + waited[length - 1];
        }
        return `${waited.join(length > 2 ? ", " : " ")} ${length > 1 ? "are" : "is"} ${label}`;
    };

    const {time, running_ids, ended_ids, launched_ids, finished_ids} = wait;
    const schedules = [
        dependencyString("running", running_ids),
        dependencyString("ended", ended_ids),
        dependencyString("started", launched_ids),
        dependencyString("finished", finished_ids),
    ].filter((s: string) => Boolean(s));

    const l = schedules.length;
    if (!l) {
        if (time) {
            return `Started ${time} seconds in`;
        } else {
            return "Started immediately";
        }
    } else {
        if (l > 1) {
            schedules[l - 1] = "and " + schedules[l - 1];
        }
        const timeString = time ? `${time} seconds` : "immediately";
        return "Started " + timeString + " after " + schedules.join(l > 2 ? ", " : " ");
    }
};


const ScenarioFunctions: React.FC<Props> = (props) => {
    const {scenario} = props;
    const project = useSelector((state) => state.project.current);
    const {getValues} = useFormContext<Form>();
    const {fields, append, remove} = useFieldArray({name: "functions"});
    const [, forceRefresh] = React.useState<object>({});

    const otherScenarios = React.useMemo(() => {
        if (!project) {
            return [];
        }

        return project.scenario.filter((s: IScenario) => s.name !== scenario);
    }, [scenario, project]);

    const handleFunctionAdd = React.useCallback(() => {
        const id = parseInt("xxxxxxx".replace(/[x]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        }), 16);
        append({id, parameters: {}});
    }, [append]);

    const handleFunctionRemove = React.useCallback((index: number) => () => {
        remove(index);
    }, [remove]);

    const refresh = React.useCallback(() => {
        forceRefresh({});
    }, []);

    const functions = getValues("functions");

    return (
        <React.Fragment>
            {functions?.length > 0 && fields.map((field, index: number) => {
                const field_id = field.id;
                const f = functions[index]
                const others = functions.filter((other: FunctionForm, i: number) => other.label && index !== i);

                return (
                    <ListItem
                        key={field_id}
                        leftIcon={<DeleteIcon title="Delete this OpenBACH function" />}
                        onLeftClick={handleFunctionRemove(index)}
                        primary={mainLabel(f, others)}
                        secondary={dependenciesLabel(f, others)}
                        nestedItems={<Paper sx={{px: "2%", py: 2}}>
                            <Box display="flex" gap="2%" alignItems="top">
                                <Box width="32%">
                                    <Controller
                                        name={`functions.${index}.label`}
                                        rules={{required: false}}
                                        defaultValue=""
                                        render={({field: {onChange, onBlur, value, ref}}) => (
                                            <TextField
                                                margin="dense"
                                                variant="standard"
                                                label="Label"
                                                onChange={(e) => {onChange(e); refresh();}}
                                                onBlur={onBlur}
                                                value={value}
                                                inputRef={ref}
                                                fullWidth
                                            />
                                        )}
                                    />
                                </Box>
                                <Box width="32%">
                                    <FormControl sx={{mt: 1, width: "100%"}}>
                                        <InputLabel id={`${field_id}-fail-label`} sx={{mt: 1}}>
                                            Fail Policy
                                        </InputLabel>
                                        <Controller
                                            name={`functions.${index}.on_fail.policy`}
                                            rules={{required: false}}
                                            defaultValue=""
                                            render={({field: {onChange, onBlur, value, ref}}) => (
                                                <Select
                                                    id={`${field_id}-fail-select`}
                                                    labelId={`${field_id}-fail-label`}
                                                    label="Fail Policy"
                                                    variant="standard"
                                                    onChange={onChange}
                                                    onBlur={onBlur}
                                                    value={value}
                                                    inputRef={ref}
                                                    fullWidth
                                                >
                                                    <MenuItem value="Fail">Fail</MenuItem>
                                                    <MenuItem value="Ignore">Ignore</MenuItem>
                                                    <MenuItem value="Retry">Retry</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                    {f.on_fail?.policy === "Retry" && (<NumberField
                                        variant="standard"
                                        label="Retry Limit"
                                        fullWidth
                                        name={`functions.${index}.on_fail.retry`}
                                        rules={{required: false}}
                                        defaultValue=""
                                    />)}
                                    {f.on_fail?.policy === "Retry" && (<NumberField
                                        variant="standard"
                                        label="Retry Delay"
                                        fullWidth
                                        step={0.1}
                                        name={`functions.${index}.on_fail.delay`}
                                        rules={{required: false}}
                                        defaultValue=""
                                    />)}
                                </Box>
                                <FormControl sx={{width: "32%", mt: 1}}>
                                    <InputLabel id={`${field_id}-kind-label`} sx={{mt: 1}}>
                                        Openbach Function
                                    </InputLabel>
                                    <Controller
                                        name={`functions.${index}.kind`}
                                        rules={{required: true}}
                                        defaultValue={"" as unknown as undefined}
                                        render={({field: {onChange, onBlur, value, ref}}) => (
                                            <Select
                                                id={`${field_id}-kind-select`}
                                                labelId={`${field_id}-kind-label`}
                                                label="Openbach Function"
                                                variant="standard"
                                                onChange={(e) => {onChange(e); refresh();}}
                                                onBlur={onBlur}
                                                value={value}
                                                inputRef={ref}
                                                fullWidth
                                            >
                                                {OpenbachFunctionsList.map((label: OpenbachFunctionType) => (
                                                    <MenuItem key={label} value={label}>{label}</MenuItem>
                                                ))}
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                            </Box>
                            <Box>
                                <Box component="p" display="inline" mr="10px">
                                    The controller will start this function
                                </Box>
                                <NumberField
                                    variant="standard"
                                    label="Waiting Time"
                                    sx={{verticalAlign: "baseline"}}
                                    step={0.1}
                                    name={`functions.${index}.wait.time`}
                                    rules={{required: false}}
                                    defaultValue=""
                                />
                                <Box component="p" display="inline" ml="10px">
                                    seconds after
                                </Box>
                            </Box>
                            <Box mt="5px" mb="15px">
                                <WaitFor
                                    awaitables={others}
                                    label="openbach functions are first running and"
                                    name={`functions.${index}.wait.running_ids`}
                                    rules={{required: false}}
                                    defaultValue={[]}
                                    forceRefresh={refresh}
                                />
                                <WaitFor
                                    awaitables={others}
                                    label="openbach functions are ended and"
                                    name={`functions.${index}.wait.ended_ids`}
                                    rules={{required: false}}
                                    defaultValue={[]}
                                    forceRefresh={refresh}
                                />
                                <WaitFor
                                    awaitables={others}
                                    label="jobs/scenarios are started and"
                                    name={`functions.${index}.wait.launched_ids`}
                                    rules={{required: false}}
                                    defaultValue={[]}
                                    forceRefresh={refresh}
                                />
                                <WaitFor
                                    awaitables={others}
                                    label="jobs/scenarios are finished."
                                    name={`functions.${index}.wait.finished_ids`}
                                    rules={{required: false}}
                                    defaultValue={[]}
                                    forceRefresh={refresh}
                                />
                            </Box>
                            <Divider sx={{my: 1}} />
                            {f.kind == null && <Box component="h3">Unselected Openbach Function</Box>}
                            {!OpenbachFunctionsList.includes(f.kind!) && <Box component="h3">{f.kind}</Box>}
                            {f.kind === "start_job_instance" && <StartJobInstance
                                id={field_id}
                                index={index}
                                others={others}
                                refresh={refresh}
                            />}
                            {f.kind === "stop_job_instances" && <StopJobInstance
                                id={field_id}
                                index={index}
                                others={others}
                                refresh={refresh}
                            />}
                            {f.kind === "start_scenario_instance" && <StartScenarioInstance
                                id={field_id}
                                index={index}
                                scenarios={otherScenarios}
                                refresh={refresh}
                            />}
                            {f.kind === "stop_scenario_instance" && <StopScenarioInstance
                                id={field_id}
                                index={index}
                                others={others}
                                refresh={refresh}
                            />}
                        </Paper>}
                    />
                );
            })}
            <ListItemButton onClick={handleFunctionAdd}>
                <ListItemIcon><Add /></ListItemIcon>
                <ListItemText primary="Add new OpenBACH function" />
            </ListItemButton>
        </React.Fragment>
    );
};


interface Props {
    scenario: string;
}


export default ScenarioFunctions;
