import React from 'react';

import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import Dialog from '../common/ActionDialog';

import {addExternalJob} from '../../api/jobs';
import {useDispatch} from '../../redux';
import type {IExternalJobInfos} from '../../utils/interfaces';


const ExternalJobsInstaller: React.FC<Props> = (props) => {
    const {externalJobs} = props;
    const [selectedJob, storeSelectedJob] = React.useState<string>();
    const dispatch = useDispatch();

    const handleJobSelection = React.useCallback((jobName: string) => () => {
        storeSelectedJob(jobName);
    }, []);

    const handleClose = React.useCallback(() => {
        storeSelectedJob(undefined);
    }, []);

    const handleAdd = React.useCallback(() => {
        if (selectedJob) {
            dispatch(addExternalJob({name: selectedJob}));
        }
        storeSelectedJob(undefined);
    }, [selectedJob, dispatch]);

    const jobs = externalJobs.map((job: IExternalJobInfos) => (
        <ListItemButton key={job.name} onClick={handleJobSelection(job.name)}>
            <ListItemText primary={job.display} />
        </ListItemButton>
    ));
    if (!jobs.length) {
        jobs.push((
            <ListItemButton key="unavailable" disabled>
                <ListItemText primary="No jobs available" />
            </ListItemButton>
        ));
    }

    return (
        <React.Fragment>
            <List>{jobs}</List>
            <Dialog
                title="Install External Job"
                open={Boolean(selectedJob)}
                cancel={{label: "Cancel", action: handleClose}}
                actions={[{label: "Install", action: handleAdd}]}
            >
                <DialogContent>
                    <DialogContentText>
                        You are about to add the job {selectedJob} into the
                        controller. For more informations, you can browse
                        the job descriptions on <a
                            href="https://github.com/CNES/openbach/blob/master/src/jobs/README.md"
                            target="_blank"
                            rel="noreferrer"
                        >
                            the OpenBACH wiki
                        </a>.
                    </DialogContentText>
                    <DialogContentText>
                        Proceed?
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
};


interface Props {
    externalJobs: IExternalJobInfos[];
}


export default ExternalJobsInstaller;
