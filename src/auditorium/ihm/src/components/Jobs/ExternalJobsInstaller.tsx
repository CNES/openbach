import * as React from "react";
import {connect} from "react-redux";

import {List, ListItem} from "material-ui/List";

import {addExternalJob} from "../../actions/job";
import {IExternalJobInfos} from "../../interfaces/job.interface";

import ActionDialog from "../common/ActionDialog";


class ExternalJobsInstaller extends React.Component<IProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = {selectedJob: null};
        this.onJobCancel = this.onJobCancel.bind(this);
        this.onJobInstall = this.onJobInstall.bind(this);
    }

    public render() {
        const jobName = this.state.selectedJob;
        const jobs = this.props.jobs.map((job: IExternalJobInfos) => (
            <ListItem key={job.name} primaryText={job.display} onClick={this.onJobClick.bind(this, job.name)} />
        ));

        if (!jobs.length) {
            jobs.push(<ListItem key="unavailable" disabled={true} primaryText="No jobs available" />);
        }

        return (
            <List>
                {jobs}
                <ActionDialog
                    open={Boolean(jobName)}
                    title="Install External Job"
                    modal={false}
                    cancel={{label: "Cancel", action: this.onJobCancel}}
                    actions={[{label: "Install", action: this.onJobInstall}]}
                >
                    <p>You are about to add the job {jobName} into the
                    controller. For more informations, you can browse
                    the job descriptions on <a
                        href="https://github.com/CNES/openbach/blob/master/src/jobs/README.md"
                        target="_blank"
                    >
                        the OpenBACH wiki
                    </a>.</p>
                    <p>Proceed?</p>
                </ActionDialog>
            </List>
        );
    }

    private onJobClick(job_name) {
        this.setState({ selectedJob: job_name });
    }

    private onJobCancel() {
        this.setState({ selectedJob: null });
    }

    private onJobInstall() {
        const {selectedJob} = this.state;
        if (selectedJob) {
            this.props.install(selectedJob);
            this.onJobCancel();
        }
    }
};


interface IState {
    selectedJob: string;
};


interface IProps {
    jobs: IExternalJobInfos[];
};


interface IDispatchProps {
    install: (jobName: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    install: (jobName: string) => dispatch(addExternalJob(jobName)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(ExternalJobsInstaller);
