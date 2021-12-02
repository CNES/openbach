import * as React from "react";
import {connect} from "react-redux";
import {Option as ReactSelectOption} from "react-select";

import IconButton from "material-ui/IconButton";
import {List, ListItem} from "material-ui/List";
import Popover from "material-ui/Popover";
import TextField from "material-ui/TextField";

import {getAgents} from "../../actions/agent";
import {notify} from "../../actions/global";
import {installOnAgents, stateJob, uninstallOnAgents} from "../../api/job";
import {IExternalJobInfos, IJob} from "../../interfaces/job.interface";
import {InfoIcon, SearchIcon} from "../../utils/theme";

import ActionDialog from "../common/ActionDialog";
import JobAgents from "./JobAgents";
import JobDescription from "./JobDescription";
import JobUpdater from "./JobUpdater";


interface IStyles {
    icon: React.CSSProperties;
    list: React.CSSProperties;
    nested: React.CSSProperties;
};

const styles: IStyles = {
    icon: {
        position: "absolute",
        right: "0px",
        top: "20px",
    },
    list: {
        columns: "auto 3",
    },
    nested: {
        backgroundColor: "#F8F8F8",
    },
};


class AdminJobList extends React.Component<IProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = {
            agentsForInstall: [],
            agentsForRemove: [],
            agentsForUpdate: [],
            jobToUpdate: undefined,
            jobsFilter: "",
        };
        this.handleJobsFilterChange = this.handleJobsFilterChange.bind(this);
        this.onJobUpdate = this.onJobUpdate.bind(this);
        this.onDialogClose = this.onDialogClose.bind(this);
        this.onInstallRemove = this.onInstallRemove.bind(this);
        this.onInstallRemoveUpdate = this.onInstallRemoveUpdate.bind(this);
        this.waitForOperation = this.waitForOperation.bind(this);
        this.refreshStatus = this.refreshStatus.bind(this);
    }

    public render() {
        const {agentsForInstall, agentsForRemove, agentsForUpdate, jobToUpdate, jobsFilter} = this.state;
        const filteredJobs = this.props.jobs.filter(
            (job) => job.general.name.search(jobsFilter) !== -1
            || job.general.description.search(jobsFilter) !== -1
            || job.general.keywords.findIndex((element) => element.search(jobsFilter) !== -1) !== -1,
        );

        const jobs = filteredJobs.sort((jobA: IJob, jobB: IJob) => (
            jobA.general.name.localeCompare(jobB.general.name)
        )).map((job: IJob, index: number) => {
            let updateAvailable = this.props.availableJobs.internalJobs.find((j: IExternalJobInfos) => (j.name === job.general.name));
            const coreJob = Boolean(updateAvailable);
            if (!coreJob) {
                updateAvailable = this.props.availableJobs.externalJobs.find((j: IExternalJobInfos) => (j.name === job.general.name));
            }

            const innerFeatures = [
                <JobUpdater key="Version" job={job} updateAvailable={updateAvailable} updateInternal={coreJob} />,
                <JobDescription key="Description" description={job.general.description} />,
                <JobAgents key="Agents" job={job} onJobUpdate={this.onJobUpdate} />,
            ];

            return (
                <ListItem
                    key={index}
                    primaryText={job.general.name}
                    secondaryText={"Keywords: " + job.general.keywords.join(", ")}
                    primaryTogglesNestedList={true}
                    nestedItems={innerFeatures}
                    nestedListStyle={styles.nested}
                />
            );
        });

        let firstActionTitle = null;
        let secondActionTitle = null;
        let updateParagraphIntro = "Additionally, you can also update it on";

        if (agentsForRemove.length && agentsForInstall.length) {
            if (agentsForUpdate.length) {
                firstActionTitle = "Install, Remove AND Update";
                secondActionTitle = "Install and Remove ONLY";
            } else {
                secondActionTitle = "Install and Remove Job on Agents";
            }
        } else if (agentsForRemove.length) {
            if (agentsForUpdate.length) {
                firstActionTitle = "Remove AND Update";
                secondActionTitle = "Remove ONLY";
            } else {
                secondActionTitle = "Remove Job on Agents";
            }
        } else if (agentsForInstall.length) {
            if (agentsForUpdate.length) {
                firstActionTitle = "Install AND Update";
                secondActionTitle = "Install ONLY";
            } else {
                secondActionTitle = "Install Job on Agents";
            }
        } else if (agentsForUpdate.length) {
            firstActionTitle = "Update Job on Agents";
            updateParagraphIntro = "You will update it on";
        }

        const dialogActions = [];
        if (firstActionTitle !== null) {
            dialogActions.push({ action: this.onInstallRemoveUpdate, label: firstActionTitle });
        }
        if (secondActionTitle !== null) {
            dialogActions.push({ action: this.onInstallRemove, label: secondActionTitle });
        }

        return (
            <div style={{position: "relative"}}>
                <TextField
                    hintText="Filter Jobs"
                    floatingLabelText="Filter Jobs"
                    value={jobsFilter}
                    onChange={this.handleJobsFilterChange}
                    fullWidth={true}
                />
                <IconButton style={styles.icon}>
                    <SearchIcon />
                </IconButton>
                <List style={styles.list}>{jobs}</List>
                <ActionDialog
                    open={jobToUpdate && dialogActions.length !== 0}
                    title="(Un)Install Job on Agents"
                    modal={false}
                    cancel={{label: "Cancel", action: this.onDialogClose}}
                    actions={dialogActions}
                    auto={true}
                >
                    <p>You are about to manage the job {jobToUpdate} on your agents!</p>
                    {this.makeParagraph("You will install it on", agentsForInstall)}
                    {this.makeParagraph("You will remove it on", agentsForRemove)}
                    {this.makeParagraph(updateParagraphIntro, agentsForUpdate)}
                </ActionDialog>
            </div>
        );
    }

    public componentDidMount() {
        this.props.loadAgents();
    }

    private handleJobsFilterChange(event) {
        this.setState({ jobsFilter: event.target.value });
    }

    private makeParagraph(introduction: string, elements: ReactSelectOption[]) {
        if (!elements.length) {
            return null;
        }

        return (
            <p>{introduction}: <ul>{elements.map((element: ReactSelectOption) => (<li>{element.label}</li>))}</ul></p>
        );
    }

    private onJobUpdate(jobName: string, updates: ReactSelectOption[], installs: ReactSelectOption[], removes: ReactSelectOption[]) {
        this.setState({
            agentsForInstall: installs,
            agentsForRemove: removes,
            agentsForUpdate: updates,
            jobToUpdate: jobName,
        });
    }

    private onDialogClose() {
        this.setState({
            agentsForInstall: [],
            agentsForRemove: [],
            agentsForUpdate: [],
            jobToUpdate: undefined,
        });
    }

    private onInstallRemove() {
        const {agentsForInstall, agentsForRemove, jobToUpdate} = this.state;
        if (agentsForInstall.length) {
            const addresses = agentsForInstall.map((option: ReactSelectOption) => option.value as string);
            installOnAgents(jobToUpdate, addresses).then((onSuccess) => {
                this.waitForOperation(jobToUpdate, addresses, "install");
            }).catch((error: Error) => this.props.notify("Could not start installation of job " + jobToUpdate + ": " + error.message));
        }
        if (agentsForRemove.length) {
            const addresses = agentsForRemove.map((option: ReactSelectOption) => option.value as string);
            uninstallOnAgents(jobToUpdate, addresses).then((onSuccess) => {
                this.waitForOperation(jobToUpdate, addresses, "uninstall");
            }).catch((error: Error) => this.props.notify("Could not start uninstallation of job " + jobToUpdate + ": " + error.message));
        }
        this.onDialogClose();
    }

    private onInstallRemoveUpdate() {
        const {agentsForInstall, agentsForRemove, agentsForUpdate, jobToUpdate} = this.state;
        const updateAddresses = [...agentsForInstall, ...agentsForUpdate].map((option: ReactSelectOption) => option.value as string);
        if (updateAddresses.length) {
            installOnAgents(jobToUpdate, updateAddresses).then((onSuccess) => {
                this.waitForOperation(jobToUpdate, updateAddresses, "install");
            }).catch((error: Error) => this.props.notify("Could not start installation of job " + jobToUpdate + ": " + error.message));
        }
        if (agentsForRemove.length) {
            const addresses = agentsForRemove.map((option: ReactSelectOption) => option.value as string);
            uninstallOnAgents(jobToUpdate, addresses).then((onSuccess) => {
                this.waitForOperation(jobToUpdate, addresses, "uninstall");
            }).catch((error: Error) => this.props.notify("Could not start uninstallation of job " + jobToUpdate + ": " + error.message));
        }
        this.onDialogClose();
    }

    private waitForOperation(jobName: string, agents: string[], operation: "install" | "uninstall") {
        agents.forEach((agent: string) => {
            setTimeout(() => this.refreshStatus(jobName, agent, operation), 2000);
        });
    }

    private refreshStatus(jobName: string, agent: string, operation: "install" | "uninstall") {
        stateJob(jobName, agent).then((result) => {
            const status = result[operation];
            if (status && status.returncode !== 202) {
                this.props.notify(operation + "ation of the job " + jobName + " on agent " + agent + " ended");
            } else {
                setTimeout(() => this.refreshStatus(jobName, agent, operation), 2000);
            }
        }).catch((error) => { this.props.notify("Error fetching " + operation + " status: " + error.message); });
    }
};


interface IState {
    agentsForInstall: ReactSelectOption[];
    agentsForRemove: ReactSelectOption[];
    agentsForUpdate: ReactSelectOption[];
    jobToUpdate: string;
    jobsFilter: string;
};


interface IProps {
    availableJobs: {
        internalJobs: IExternalJobInfos[];
        externalJobs: IExternalJobInfos[];
    };
    jobs: IJob[];
};


interface IDispatchProps {
    loadAgents: () => void;
    notify: (message: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    loadAgents: () => dispatch(getAgents(false)),
    notify: (message: string) => dispatch(notify(message)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(AdminJobList);
