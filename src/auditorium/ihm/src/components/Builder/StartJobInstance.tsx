import React from 'react';
import {useController} from 'react-hook-form';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import  Present from '@mui/icons-material/Check';
import Absent from '@mui/icons-material/Close';
import {red, green, grey} from '@mui/material/colors';

import NumberField from '../common/NumberField';
import JobParameters from './StartJobInstanceParameters';

import {getJobs} from '../../api/agents';
import {useDispatch, useSelector} from '../../redux';
import type {IJob, IEntity, FunctionForm} from '../../utils/interfaces';


const StartJobInstance: React.FC<Props> = (props) => {
    const {id, index, others} = props;
    // const {entity, offset, interval, job, parameters, subcommands} = current;
    const dispatch = useDispatch();
    const jobs = useSelector((state) => state.openbach.jobs);
    const entities = useSelector((state) => state.project.current?.entity);
    const {field: entity} = useController({
        name: `functions.${index}.entity`,
        rules: {required: false},
        defaultValue: "",
    });
    const {field: job} = useController({
        name: `functions.${index}.job`,
        rules: {required: false},
        defaultValue: "",
    });
    const [availableJobs, storeAvailableJobs] = React.useState<string[]>([]);

    const jobsOnAgent = React.useMemo(() => {
        const jobsAvailable = Object.fromEntries(jobs!.map((j: IJob) => ([j.general.name, false])));
        availableJobs.forEach((job: string) => {jobsAvailable[job] = true;});
        return jobsAvailable;
    }, [jobs, availableJobs]);

    React.useEffect(() => {
        if (entity.value && entities) {
            const e = entities.find((e: IEntity) => e.name === entity.value);
            if (e && e.agent) {
                const {address} = e.agent;
                const promise = dispatch(getJobs({address}));
                promise.unwrap().then((payload) => {
                    storeAvailableJobs(payload);
                });
                return () => {promise.abort();};
            }
        }
        storeAvailableJobs([]);
    }, [entity.value, entities, dispatch]);

    const selectedJob = jobs?.find(({general: {name}}: IJob) => name === job.value);

    return (
        <React.Fragment>
            <h3>Starting Job</h3>
            <Box display="flex" gap="6%">
                <FormControl sx={{width: "47%"}}>
                    <InputLabel id={`${id}-entity-label`}>
                        Entity Name
                    </InputLabel>
                    <Select
                        id={`${id}-entity-select`}
                        labelId={`${id}-entity-label`}
                        label="Entity Name"
                        variant="standard"
                        onChange={entity.onChange}
                        onBlur={entity.onBlur}
                        value={entity.value}
                        inputRef={entity.ref}
                        fullWidth
                    >
                        {entities?.map(({name}: IEntity) => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl sx={{width: "47%"}}>
                    <InputLabel id={`${id}-job-label`}>
                        Job
                    </InputLabel>
                    <Select
                        id={`${id}-job-select`}
                        labelId={`${id}-job-label`}
                        label="Job"
                        variant="standard"
                        onChange={job.onChange}
                        onBlur={job.onBlur}
                        value={job.value}
                        inputRef={job.ref}
                        renderValue={(value) => <span>{value}</span>}
                        fullWidth
                    >
                        {jobs?.map(({general: {name}}: IJob) => (
                            <MenuItem
                                key={name}
                                value={name}
                                sx={{color: jobsOnAgent[name] ? "inherit" : grey[500]}}
                            >
                                <ListItemIcon>
                                    {jobsOnAgent[name]
                                    ? <Present sx={{color: green[500]}} />
                                    : <Absent sx={{color: red[500]}} />}
                                </ListItemIcon>
                                <ListItemText>{name}</ListItemText>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <div>
                <Box component="p" display="inline" mr="10px">
                    Optionally, the agent will run the job after
                </Box>
                <NumberField
                    variant="standard"
                    label="Offset"
                    sx={{verticalAlign: "baseline"}}
                    step={0.1}
                    name={`functions.${index}.offset`}
                    rules={{required: false}}
                    defaultValue=""
                />
                <Box component="p" display="inline" mx="10px">
                    seconds when the function is started. It will also
                    reschedule it every
                </Box>
                <NumberField
                    variant="standard"
                    label="Interval"
                    sx={{verticalAlign: "baseline"}}
                    step={0.1}
                    name={`functions.${index}.interval`}
                    rules={{required: false}}
                    defaultValue=""
                />
                <Box component="p" display="inline" ml="10px">
                    seconds after the beginning of its first run.
                </Box>
            </div>
            <Divider sx={{my: 1}} />
            <JobParameters
                id={id}
                index={index}
                job={selectedJob || job.value}
                others={others}
            />
        </React.Fragment>
    );
};


interface Props {
    id: string;
    index: number;
    others: FunctionForm[];
}


export default StartJobInstance;
