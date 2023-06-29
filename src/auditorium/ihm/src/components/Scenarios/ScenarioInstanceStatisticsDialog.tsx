import React from 'react';

import Checkbox from '@mui/material/Checkbox';
import DialogContentText from '@mui/material/DialogContentText';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import TextField from '@mui/material/TextField';

import ListItem from '../common/NestedListItem';

import {getStatisticsNames} from '../../api/influx';
import {useDispatch} from '../../redux';
import {setMessage} from '../../redux/message';
import {isStartJobInstance, isStartScenarioInstance} from '../../utils/openbach-functions';
import type {IScenarioInstance, IChronografStatistic} from '../../utils/interfaces';


const getJobNames = (scenario?: IScenarioInstance): Job[] => {
    let jobs: Job[] = [];

    if (scenario && scenario.openbach_functions) {
        scenario.openbach_functions.forEach((openbachFunction) => {
            if (isStartJobInstance(openbachFunction)) {
                if (openbachFunction.job) {
                    const {name, id, agent} = openbachFunction.job;
                    jobs.push({name, id, agent});
                }
            } else if (isStartScenarioInstance(openbachFunction)) {
                jobs = jobs.concat(getJobNames(openbachFunction.scenario));
            }
        });
    }

    return jobs;
};


const ScenarioInstanceStatisticsDialog: React.FC<Props> = (props) => {
    const {project, instance, error, onChange} = props;
    const dispatch = useDispatch();
    const [statistics, storeStatistics] = React.useState<{[jobName: string]: string[];}>({});
    const [selected, storeSelected] = React.useState<Form>({});
    const [groupedTogether, storeGroupedTogether] = React.useState<boolean>(false);

    const handleGroupedTogetherChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        storeGroupedTogether(event.target.checked);
    }, []);

    const jobs = React.useMemo(() => {
        return getJobNames(instance);
    }, [instance]);

    const isSelected = React.useCallback((jobId: number, statName: string) => {
        const stats = selected[jobId];
        if (stats) {
            const entry = stats[statName];
            if (entry) {
                return entry[0];
            }
        }
        return false;
    }, [selected]);

    const unit = React.useCallback((jobId: number, statName: string) => {
        const stats = selected[jobId];
        if (stats) {
            const entry = stats[statName];
            if (entry) {
                return entry[1];
            }
        }
        return "";
    }, [selected]);

    const handleSelectedChange = React.useCallback((jobId: number, statName: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.checked;
        storeSelected((s) => {
            const stats = s[jobId] || {};
            const entry = stats[statName];
            return {...s, [jobId]: {...stats, [statName]: entry ? [selected, entry[1]] : [selected, ""]}};
        });
    }, []);

    const handleUnitChange = React.useCallback((jobId: number, statName: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        storeSelected((s) => {
            const stats = s[jobId] || {};
            const entry = stats[statName];
            return {...s, [jobId]: {...stats, [statName]: entry ? [entry[0], value] : [false, value]}};
        });
    }, []);

    React.useEffect(() => {
        storeStatistics({});
        const promise = dispatch(getStatisticsNames({project}));
        promise.unwrap().then((payload) => {
            storeStatistics(payload);
        }).catch((error: Error) => {
            if (error.name !== "AbortError") {
                dispatch(setMessage("Statistics names could not be fetched: " + error.message));
            }
        });
        return () => {promise.abort();};
    }, [project, dispatch]);

    React.useEffect(() => {
        const stats = Object.entries(selected).reduce(
            (accumulator, [jobID, statistics]: [string, FormJob]) => accumulator.concat(
                Object.entries(statistics).filter(
                    ([statName, entry]: [string, FormEntry]) => entry[0]
                ).map(
                    ([statName, entry]: [string, FormEntry]) => {
                        const jobId = Number(jobID);
                        const unit = entry[1];
                        const j = jobs.find(({id}: Job) => id === jobId);
                        if (j) {
                            const {agent: jobAgent, name: jobName} = j;
                            return {jobAgent, jobName, jobId, statName, unit};
                        } else {
                            return {jobAgent: "", jobName: "", jobId, statName, unit};
                        }
                    }
                )
            ),
            [] as IChronografStatistic[],
        );
        onChange({grouped: groupedTogether, statistics: stats});
    }, [selected, groupedTogether, jobs, onChange]);

    if (error != null) {
        return (
            <React.Fragment>
                <DialogContentText>
                    Chronograf returned the error {error} when trying to
                    create the dashboard for the selected statistics.
                </DialogContentText>
                <DialogContentText>
                    Would you like to open Chronograf to further understand the problem?
                </DialogContentText>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <List>
                {jobs.map(({name, id, agent}: Job, index: number) => (
                    <ListItem
                        key={index}
                        primary={`${name} (id ${id} on ${agent})`}
                        initiallyOpen
                        nestedItems={
                            (statistics[name] || []).map((statName: string, i: number) => (
                                <ListItem
                                    key={i}
                                    primary={statName}
                                    leftIcon={<Checkbox
                                        checked={isSelected(id, statName)}
                                        onChange={handleSelectedChange(id, statName)}
                                    />}
                                    rightIcon={<TextField
                                        margin="dense"
                                        variant="standard"
                                        label="Units"
                                        value={unit(id, statName)}
                                        onChange={handleUnitChange(id, statName)}
                                        sx={{width: 200}}
                                    />}
                                />
                            ))
                        }
                    />
                ))}
            </List>
            <FormGroup>
                <FormControlLabel
                    control={<Checkbox checked={groupedTogether} onChange={handleGroupedTogetherChange} />}
                    label="Select this option to group in the same graph the statistics of a single job that share the same units"
                />
            </FormGroup>
        </React.Fragment>
    );
};


interface Props {
    instance: IScenarioInstance;
    project: string;
    error?: string;
    onChange: (data: {grouped: boolean; statistics: IChronografStatistic[];}) => void;
}


interface Job {
    id: number;
    name: string;
    agent: string;
}


interface Form {
    [id: number]: FormJob;
}


interface FormJob {
    [statName: string]: FormEntry;
}


type FormEntry = [boolean, string];


export default ScenarioInstanceStatisticsDialog;
