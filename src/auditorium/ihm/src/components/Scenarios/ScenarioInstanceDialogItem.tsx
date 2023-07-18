import React from 'react';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import ListItem from '../common/NestedListItem';
import OpenbachFunctionIcon from '../common/OpenbachFunctionIcon';
import OpenbachFunctionStatusIcon from '../common/OpenbachFunctionStatusIcon';
import JobInstanceStatusIcon from '../common/JobInstanceStatusIcon';
import ScenarioInstanceStatusIcon from '../common/ScenarioInstanceStatusIcon';

import {
    isStartJobInstance, isStartScenarioInstance,
    isStopJobInstances, isStopScenarioInstance,
    formatScenarioDuration, extractOpenbachFunctionName,
    idToLabel,
} from '../../utils/openbach-functions';
import type {IScenarioInstance, IOpenbachFunctionInstance} from '../../utils/interfaces';


const titleFromLabel = (title: string, {label}: IOpenbachFunctionInstance): string => {
    if (!label) {
        return title;
    }
    return `[${label}] (${title})`;
};


const ScenarioInstanceDialogItem: React.FC<Props> = (props) => {
    const {instance: {arguments: args, openbach_functions}} = props;

    if (!openbach_functions) {
        return (
            <ListItemButton>
                <ListItemText primary="Fetching full instance, please wait" />
            </ListItemButton>
        );
    }

    return (
        <React.Fragment>
            {args && <ListItem
                primary="Arguments"
                leftIcon={<OpenbachFunctionIcon function="argument" />}
                nestedItems={args.map(({name, value}, index) => (
                    <ListItemButton key={index}>
                        <ListItemText primary={name} secondary={value} />
                    </ListItemButton>
                ))}
            />}
            {openbach_functions.map((openbachFunction: IOpenbachFunctionInstance, index: number) => {
                if (isStartJobInstance(openbachFunction)) {
                    const {status, job} = openbachFunction;
                    return (
                        <ListItem
                            key={index}
                            primary={titleFromLabel("Start job instance", openbachFunction)}
                            leftIcon={<OpenbachFunctionIcon function="openbach_function" />}
                            rightIcon={<OpenbachFunctionStatusIcon status={status} />}
                            initiallyOpen
                            inset
                            nestedItems={job && <ListItem
                                primary={`${job.name} on ${job.entity} (${job.agent})`}
                                secondary={`(job instance id: ${job.id})`}
                                rightIcon={<JobInstanceStatusIcon status={job.status} />}
                                leftIcon={<OpenbachFunctionIcon function="start_job_instance" />}
                            />}
                        />
                    )
                } else if (isStartScenarioInstance(openbachFunction)) {
                    const {status, scenario} = openbachFunction;
                    return (
                        <ListItem
                            key={index}
                            primary={titleFromLabel("Start scenario instance", openbachFunction)}
                            leftIcon={<OpenbachFunctionIcon function="openbach_function" />}
                            rightIcon={<OpenbachFunctionStatusIcon status={status} />}
                            initiallyOpen
                            inset
                            nestedItems={scenario && <ListItem
                                primary={scenario.scenario_name}
                                secondary={formatScenarioDuration(scenario)}
                                rightIcon={<ScenarioInstanceStatusIcon status={scenario.status} />}
                                leftIcon={<OpenbachFunctionIcon function="start_scenario_instance" />}
                                initiallyOpen
                                nestedItems={<ScenarioInstanceDialogItem instance={openbachFunction.scenario} />}
                            />}
                        />
                    );
                } else if (isStopJobInstances(openbachFunction)) {
                    const ids = openbachFunction.stop_job_instances.openbach_function_ids.map(
                        (id: number) => idToLabel(id, openbach_functions)
                    );
                    return (
                        <ListItem
                            key={index}
                            primary={titleFromLabel("Stop job instance", openbachFunction)}
                            secondary={"Stopping jobs " + ids.join(", ")}
                            leftIcon={<OpenbachFunctionIcon function="openbach_function" />}
                            rightIcon={<OpenbachFunctionStatusIcon status={openbachFunction.status} />}
                        />
                    );
                } else if (isStopScenarioInstance(openbachFunction)) {
                    const {openbach_function_id: id} = openbachFunction.stop_scenario_instance;
                    return (
                        <ListItem
                            key={index}
                            primary={titleFromLabel("Stop scenario instance", openbachFunction)}
                            secondary={"Stopping scenario " + idToLabel(id, openbach_functions)}
                            leftIcon={<OpenbachFunctionIcon function="openbach_function" />}
                            rightIcon={<OpenbachFunctionStatusIcon status={openbachFunction.status} />}
                        />
                    );
                }

                const obfName = extractOpenbachFunctionName(openbachFunction);
                return (
                    <ListItem
                        key={index}
                        primary={titleFromLabel(obfName || "unknown", openbachFunction)}
                    />
                );
            })}
        </React.Fragment>
    );
};


interface Props {
    instance: IScenarioInstance;
}


export default ScenarioInstanceDialogItem;
