import React from 'react';

import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import ImageList from '@mui/material/ImageList';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import TextField from '@mui/material/TextField';

import Search from '@mui/icons-material/Search';

import Dialog from '../common/ActionDialog';
import JobsListItem from './JobsListItem';

import {stateJob, installOnAgents, uninstallOnAgents} from '../../api/jobs';
import {useDispatch, useSelector} from '../../redux';
import {setMessage} from '../../redux/message';
import type {IAgent, IJob, IExternalJobInfos} from '../../utils/interfaces';


const dialogItems = (agents?: IAgent[]) => (address: string) => {
    const agent = agents?.find((agent: IAgent) => agent.address === address);
    if (!agent) {
        return address;
    }

    return `${agent.name} at ${agent.address}`;
};


const dialogOptions = (install: boolean, remove: boolean, update: boolean): [string | null, string | null, string] => {
    const updateIntro = "Additionally, you can also update it on";

    if (install && remove) {
        if (update) {
            return ["Install, Remove AND Update", "Install and Remove ONLY", updateIntro];
        }
        return [null, "Install and Remove Job on Agents", updateIntro];
    }

    if (remove) {
        if (update) {
            return ["Remove AND Update", "Remove ONLY", updateIntro];
        }
        return [null, "Remove Job on Agents", updateIntro];
    }

    if (install) {
        if (update) {
            return ["Install AND Update", "Install ONLY", updateIntro];
        }
        return [null, "Install Job on Agents", updateIntro];
    }

    if (update) {
        return ["Update Job on Agents", null, "You will update it on"];
    }
    return [null, null, updateIntro];
};


const Paragraph: React.FC<{introduction: string; elements: string[];}> = (props) => {
    const {introduction, elements} = props;

    if (!elements.length) {
        return null;
    }

    return (
        <p>
            {introduction}
            <ul>
                {elements.map((e: string) => <li>{e}</li>)}
            </ul>
        </p>
    );
};


const JobsList: React.FC<Props> = (props) => {
    const {internalJobs, externalJobs} = props;
    const [jobsFilter, storeJobsFilter] = React.useState<string>();
    const [jobUpdater, storeJobUpdater] = React.useState<JobUpdater>({install: [], remove: [], update: []});
    const jobs = useSelector((state) => state.openbach.jobs);
    const agents = useSelector((state) => state.openbach.agents);
    const dispatch = useDispatch();

    const handleFilterChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        storeJobsFilter(event.target.value);
    }, []);

    const handleUpdateChange = React.useCallback((update: Required<JobUpdater>) => {
        storeJobUpdater(update);
    }, []);

    const handleClose = React.useCallback(() => {
        storeJobUpdater({install: [], remove: [], update: []});
    }, []);

    const refreshStatus = React.useCallback((name: string, agent: string, operation: "install" | "uninstall") => {
        dispatch(stateJob({jobName: name, agent})).unwrap().then((payload) => {
            const status = payload[operation];
            if (status && status.returncode !== 202) {
                dispatch(setMessage(operation + "ation of the job " + name + " on agent "
                                    + agent + " ended with status code " + status.returncode));
            } else {
                setTimeout(() => refreshStatus(name, agent, operation), 2000);
            }
        });
    }, [dispatch]);

    const handleInstall = React.useCallback((job: string, addresses: string[]) => {
        if (addresses.length) {
            dispatch(installOnAgents({jobNames: [job], agents: addresses})).unwrap().then(() => {
                dispatch(setMessage("Started installation for " + job));
            });
            addresses.forEach((address: string) => {
                setTimeout(() => refreshStatus(job, address, "install"), 2000);
            });
        }
    }, [dispatch, refreshStatus]);

    const handleUninstall = React.useCallback((job: string, addresses: string[]) => {
        if (addresses.length) {
            dispatch(uninstallOnAgents({jobNames: [job], agents: addresses})).unwrap().then(() => {
                dispatch(setMessage("Started uninstallation for " + job));
            });
            addresses.forEach((address: string) => {
                setTimeout(() => refreshStatus(job, address, "uninstall"), 2000);
            });
        }
    }, [dispatch, refreshStatus]);

    const handleClickInstall = React.useCallback(() => {
        const {name, install, remove} = jobUpdater;
        if (name) {
            handleInstall(name, install);
            handleUninstall(name, remove);
        }
        handleClose();
    }, [jobUpdater, handleInstall, handleUninstall, handleClose]);

    const handleClickUpdate = React.useCallback(() => {
        const {name, install, update, remove} = jobUpdater;
        if (name) {
            handleInstall(name, [...install, ...update]);
            handleUninstall(name, remove);
        }
        handleClose();
    }, [jobUpdater, handleInstall, handleUninstall, handleClose]);

    const filteredJobs = (jobs || []).filter((job: IJob) => (
        job.general.name.search(jobsFilter!) !== -1
        || job.general.description.search(jobsFilter!) !== -1
        || job.general.keywords.findIndex((element: string) => element.search(jobsFilter!) !== -1) !== -1
    )).sort((jobA: IJob, jobB: IJob) => (
        jobA.general.name.localeCompare(jobB.general.name)
    )).map((job: IJob, index: number) => {
        const jobFinder = (j: IExternalJobInfos) => j.name === job.general.name;
        const coreJob = internalJobs.find(jobFinder);
        const updateAvailable = coreJob || externalJobs.find(jobFinder);

        return (
            <JobsListItem
                key={index}
                job={job}
                update={updateAvailable}
                isCore={Boolean(coreJob)}
                onUpdate={handleUpdateChange}
            />
        );
    });

    const [actionAndUpdate, action, updateIntro] = dialogOptions(
        jobUpdater.install.length !== 0,
        jobUpdater.remove.length !== 0,
        jobUpdater.update.length !== 0,
    );
    const dialogActionAndUpdate = actionAndUpdate ? [{label: actionAndUpdate, action: handleClickUpdate}] : [];
    const dialogActions = dialogActionAndUpdate.concat(action ? [{label: action, action: handleClickInstall}] : []);

    return (
        <React.Fragment>
            <TextField
                autoFocus
                margin="dense"
                variant="standard"
                color="secondary"
                label="FilterJobs"
                value={jobsFilter}
                onChange={handleFilterChange}
                InputProps={{endAdornment: <InputAdornment position="end"><Search /></InputAdornment>}}
                fullWidth
            />
            <List>
                <ImageList cols={3} gap={8} variant="masonry">
                    {filteredJobs}
                </ImageList>
            </List>
            <Dialog
                title="(Un)Install Job on Agents"
                open={Boolean(jobUpdater.name) && dialogActions.length !== 0}
                cancel={{label: "Cancel", action: handleClose}}
                actions={dialogActions}
            >
                <DialogContent>
                    <DialogContentText>
                        <p>You are about to manage the job {jobUpdater.name} on your agents!</p>
                        <Paragraph
                            introduction="You will install it on"
                            elements={jobUpdater.install.map(dialogItems(agents))}
                        />
                        <Paragraph
                            introduction="You will remove it on"
                            elements={jobUpdater.remove.map(dialogItems(agents))}
                        />
                        <Paragraph
                            introduction={updateIntro}
                            elements={jobUpdater.update.map(dialogItems(agents))}
                        />
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
};


interface Props {
    internalJobs: IExternalJobInfos[];
    externalJobs: IExternalJobInfos[];
}


interface JobUpdater {
    name?: string;
    install: string[];
    remove: string[];
    update: string[];
}


export default JobsList;
