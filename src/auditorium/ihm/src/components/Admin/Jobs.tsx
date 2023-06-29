import React from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import JobCreator from './JobCreator';
import JobsList from './JobsList';
import ExternalJobsInstaller from './ExternalJobsInstaller';

import {getAgents} from '../../api/agents';
import {getJobs, externalJobs, internalJobs} from '../../api/jobs';
import {useDispatch, useSelector} from '../../redux';
import {setTitle} from '../../redux/message';
import type {IExternalJobInfos} from '../../utils/interfaces';


const Jobs: React.FC<Props> = (props) => {
    const isAdmin = useSelector((state) => state.login.is_admin);
    const [extJobs, storeExternalJobs] = React.useState<IExternalJobInfos[]>([]);
    const [intJobs, storeInternalJobs] = React.useState<IExternalJobInfos[]>([]);
    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(setTitle("OpenBach Administration"));
        const getExternalJobs = dispatch(externalJobs());
        const getInternalJobs = dispatch(internalJobs());
        const promises = [
            dispatch(getJobs()),
            dispatch(getAgents({services: false})),
            getExternalJobs,
            getInternalJobs,
        ];
        getExternalJobs.unwrap().then((payload) => {storeExternalJobs(payload);});
        getInternalJobs.unwrap().then((payload) => {storeInternalJobs(payload);});
        return () => {promises.forEach((promise) => {promise.abort();});};
    }, [dispatch]);

    return (
        <React.Fragment>
            <h1>Available Jobs</h1>
            {isAdmin && <Box display="inline-block" marginRight="10%" sx={{verticalAlign: "top"}} width="20%">
                <h2>Add a new Job</h2>
                <Box component="p" textAlign="justify">
                    Please provide a tar.gz file containing the
                    top-level directory of the job's definition files.
                </Box>
                <Box component="p" textAlign="justify">
                    Most likely the tar.gz file should contain
                    a "files" directory, the "install_&lt;job_name&gt;.yml"
                    file and the "uninstall_&lt;job_name&gt;.yml" file; all
                    located at the root of the archive.
                </Box>
                <JobCreator />
                <Divider sx={{mt: 3, mb: 3}} />
                <h2>Install a supported external Job</h2>
                <ExternalJobsInstaller externalJobs={extJobs} />
            </Box>}
            <Box display={isAdmin ? "inline-block" : undefined} width={isAdmin ? "70%" : undefined}>
                <JobsList internalJobs={intJobs} externalJobs={extJobs} />
            </Box>
        </React.Fragment>
    );
};


interface Props {
}


export default Jobs;
